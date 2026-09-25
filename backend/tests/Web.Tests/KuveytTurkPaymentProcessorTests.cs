using MedineHuzur.Domain.Entities;
using MedineHuzur.Infrastructure;
using MedineHuzur.Web.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Logging.Abstractions;

namespace Web.Tests;

public sealed class KuveytTurkPaymentProcessorTests
{
    [Fact]
    public async Task InvalidHash_IsRejected()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var gateway = new FakeGateway { AuthenticationHashValid = false };
        var processor = CreateProcessor(db, gateway);

        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => processor.ProcessAsync("payload", CancellationToken.None));
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task AmountMismatch_IsRejectedWithoutProvision()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var gateway = new FakeGateway { Authentication = Response(amount: "999") };
        var processor = CreateProcessor(db, gateway);

        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => processor.ProcessAsync("payload", CancellationToken.None));
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task OrderTotalChangedAfterStart_IsRejectedWithoutProvision()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        (await db.Orders.SingleAsync()).Total = 11m;
        await db.SaveChangesAsync();
        var gateway = new FakeGateway();
        var processor = CreateProcessor(db, gateway);

        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => processor.ProcessAsync("payload", CancellationToken.None));
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task DuplicatePaidCallback_DoesNotProvisionAgain()
    {
        await using var db = CreateDb();
        await SeedAsync(db, PaymentTransactionState.Paid, PaymentStatus.Paid);
        var gateway = new FakeGateway();
        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Duplicate);
        Assert.True(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task ConcurrentCallbackAlreadyProvisioning_DoesNotProvisionAgain()
    {
        await using var db = CreateDb();
        await SeedAsync(db, PaymentTransactionState.Provisioning);
        var gateway = new FakeGateway();
        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Duplicate);
        Assert.False(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task AuthenticationFailure_DoesNotMarkPaid()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var gateway = new FakeGateway
        {
            Authentication = Response(responseCode: "05", enrolled: false, md: null)
        };
        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.False(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
        Assert.Equal(PaymentStatus.Failed, (await db.Orders.SingleAsync()).PaymentStatus);
    }

    [Fact]
    public async Task SuccessfulAuthenticationAndProvision_MarksPaid()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var gateway = new FakeGateway();
        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Paid);
        Assert.Equal(1, gateway.ProvisionCalls);
        Assert.Equal(PaymentStatus.Paid, (await db.Orders.SingleAsync()).PaymentStatus);
        Assert.Equal(PaymentTransactionState.Paid, (await db.PaymentTransactions.SingleAsync()).State);
    }

    [Fact]
    public async Task ProvisionResponseCodeOtherThanZero_DoesNotMarkPaid()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var gateway = new FakeGateway { Provision = Response(responseCode: "05") };
        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.False(result.Paid);
        Assert.Equal(1, gateway.ProvisionCalls);
        Assert.Equal(PaymentStatus.Failed, (await db.Orders.SingleAsync()).PaymentStatus);
        Assert.Equal(PaymentTransactionState.Failed, (await db.PaymentTransactions.SingleAsync()).State);
    }

    [Fact]
    public async Task AlreadyProcessedResponse_IsNotPaidFailedOrProvisionedAgain()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var gateway = new FakeGateway
        {
            Provision = Response(responseCode: "OrderIsProcessedBefore")
        };
        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.False(result.Paid);
        Assert.True(result.Duplicate);
        Assert.Equal(1, gateway.ProvisionCalls);
        Assert.Equal(PaymentStatus.Pending, (await db.Orders.SingleAsync()).PaymentStatus);
        Assert.Equal(PaymentTransactionState.Provisioning, (await db.PaymentTransactions.SingleAsync()).State);
    }

    private static KuveytTurkPaymentProcessor CreateProcessor(ECommerceContext db, FakeGateway gateway) =>
        new(db, gateway, NullLogger<KuveytTurkPaymentProcessor>.Instance);

    private static ECommerceContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ECommerceContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestContext(options);
    }

    private static async Task SeedAsync(
        ECommerceContext db,
        PaymentTransactionState state = PaymentTransactionState.AuthenticationStarted,
        PaymentStatus paymentStatus = PaymentStatus.Pending)
    {
        var order = new Order
        {
            OrderNumber = "ORDER-123",
            CustomerName = "Test Customer",
            Email = "test@example.com",
            Phone = "05550000000",
            AddressText = "Test address",
            PaymentMethod = "CreditCard",
            PaymentStatus = paymentStatus,
            Total = 10m
        };
        db.Orders.Add(order);
        db.PaymentTransactions.Add(new PaymentTransaction
        {
            Order = order,
            Provider = KuveytTurkPaymentProvider.ProviderName,
            PaymentReference = "ORDER-123",
            MerchantOrderId = "ORDER-123",
            Amount = 10m,
            State = state,
            Status = paymentStatus
        });
        await db.SaveChangesAsync();
    }

    private static KuveytTurkBankResponse Response(
        string responseCode = "00",
        string amount = "1000",
        bool enrolled = true,
        string? md = "safe-md") =>
        new("ORDER-123", "BANK-1", responseCode, "safe", "safe-hash", amount, enrolled,
            md, "P1", "R1", "S1", DateTime.UtcNow, "B1");

    private sealed class FakeGateway : IKuveytTurkGateway
    {
        public KuveytTurkBankResponse Authentication { get; init; } = Response();
        public KuveytTurkBankResponse Provision { get; init; } = Response();
        public bool AuthenticationHashValid { get; init; } = true;
        public bool ProvisionHashValid { get; init; } = true;
        public int ProvisionCalls { get; private set; }

        public KuveytTurkBankResponse ParseAuthenticationResponse(string value) => Authentication;
        public bool VerifyAuthenticationResponse(KuveytTurkBankResponse response) => AuthenticationHashValid;
        public bool VerifyProvisionResponse(KuveytTurkBankResponse response) => ProvisionHashValid;
        public Task<KuveytTurkBankResponse> ProvisionAsync(
            string merchantOrderId,
            decimal amount,
            string md,
            CancellationToken cancellationToken)
        {
            ProvisionCalls++;
            return Task.FromResult(Provision);
        }
    }

    private sealed class TestContext(DbContextOptions<ECommerceContext> options)
        : ECommerceContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            var rowVersion = modelBuilder.Entity<PaymentTransaction>()
                .Property(x => x.RowVersion);
            rowVersion.IsConcurrencyToken(false).ValueGeneratedNever();
            rowVersion.Metadata.SetBeforeSaveBehavior(PropertySaveBehavior.Save);
            rowVersion.Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Save);
        }
    }
}
