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
        await using var db = await CreateDbAsync();
        await SeedAsync(db);
        var gateway = new FakeGateway { AuthenticationHashValid = false };

        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None));
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task AmountMismatch_IsRejectedWithoutProvision()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db);
        var gateway = new FakeGateway { Authentication = Response(amount: "999") };

        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None));
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task OrderTotalChangedAfterStart_IsRejectedWithoutProvision()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db);
        (await db.Orders.SingleAsync()).Total = 11m;
        await db.SaveChangesAsync();

        var gateway = new FakeGateway();
        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None));
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task DuplicatePaidCallback_DoesNotProvisionAgain()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db, PaymentTransactionState.Paid, PaymentStatus.Paid);
        var gateway = new FakeGateway();

        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Duplicate);
        Assert.True(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task FreshProvisioningCallback_DoesNotProvisionAgain()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(
            db,
            PaymentTransactionState.Provisioning,
            provisioningStartedAtUtc: DateTime.UtcNow);
        var gateway = new FakeGateway();

        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Duplicate);
        Assert.False(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
        Assert.Equal(PaymentTransactionState.Provisioning, (await db.PaymentTransactions.SingleAsync()).State);
    }

    [Fact]
    public async Task StaleProvisioningCallback_MovesToReviewRequiredWithoutRetry()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(
            db,
            PaymentTransactionState.Provisioning,
            provisioningStartedAtUtc: DateTime.UtcNow.AddMinutes(-10));
        var gateway = new FakeGateway();

        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Duplicate);
        Assert.False(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
        Assert.Equal(PaymentTransactionState.ReviewRequired, (await db.PaymentTransactions.SingleAsync()).State);
    }

    [Fact]
    public async Task ReviewRequiredCallback_NeverProvisionsAgain()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db, PaymentTransactionState.ReviewRequired);
        var gateway = new FakeGateway();

        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Duplicate);
        Assert.False(result.Paid);
        Assert.Equal(0, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task AuthenticationFailure_DoesNotMarkPaid()
    {
        await using var db = await CreateDbAsync();
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
    public async Task CreatedState_CallbackCanProceed()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db, PaymentTransactionState.Created);
        var gateway = new FakeGateway();

        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.True(result.Paid);
        Assert.Equal(1, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task SuccessfulAuthenticationAndProvision_MarksPaid()
    {
        await using var db = await CreateDbAsync();
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
        await using var db = await CreateDbAsync();
        await SeedAsync(db);
        var gateway = new FakeGateway { Provision = Response(responseCode: "05") };

        var result = await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);

        Assert.False(result.Paid);
        Assert.Equal(1, gateway.ProvisionCalls);
        Assert.Equal(PaymentStatus.Failed, (await db.Orders.SingleAsync()).PaymentStatus);
        Assert.Equal(PaymentTransactionState.Failed, (await db.PaymentTransactions.SingleAsync()).State);
    }

    [Fact]
    public async Task AlreadyProcessedResponse_MovesToReviewRequiredAndNeverRetries()
    {
        await using var db = await CreateDbAsync();
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
        Assert.Equal(PaymentTransactionState.ReviewRequired, (await db.PaymentTransactions.SingleAsync()).State);

        await CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None);
        Assert.Equal(1, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task AmbiguousNetworkFailure_MovesToReviewRequired()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db);
        var gateway = new FakeGateway { ProvisionException = new HttpRequestException("network") };

        await Assert.ThrowsAsync<HttpRequestException>(
            () => CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None));

        Assert.Equal(PaymentTransactionState.ReviewRequired, (await db.PaymentTransactions.SingleAsync()).State);
        Assert.Equal(1, gateway.ProvisionCalls);
    }

    [Fact]
    public async Task InvalidProvisionHash_MovesToReviewRequired()
    {
        await using var db = await CreateDbAsync();
        await SeedAsync(db);
        var gateway = new FakeGateway { ProvisionHashValid = false };

        await Assert.ThrowsAsync<KuveytTurkCallbackRejectedException>(
            () => CreateProcessor(db, gateway).ProcessAsync("payload", CancellationToken.None));

        Assert.Equal(PaymentTransactionState.ReviewRequired, (await db.PaymentTransactions.SingleAsync()).State);
    }

    [Fact]
    public async Task ConcurrentCallbacks_OnlyOneCanCallProvision()
    {
        var databaseName = $"kt-{Guid.NewGuid():N}";
        await using var db1 = await CreateDbAsync(databaseName);
        await SeedAsync(db1);
        await using var db2 = await CreateDbAsync(databaseName);

        var gateway = new FakeGateway { BlockProvision = true };
        var first = CreateProcessor(db1, gateway).ProcessAsync("payload", CancellationToken.None);
        await gateway.WaitUntilProvisionStartedAsync();

        var second = await CreateProcessor(db2, gateway).ProcessAsync("payload", CancellationToken.None);
        Assert.True(second.Duplicate);
        Assert.False(second.Paid);
        Assert.Equal(1, gateway.ProvisionCalls);

        gateway.ReleaseProvision();
        var firstResult = await first;
        Assert.True(firstResult.Paid);
        Assert.Equal(1, gateway.ProvisionCalls);
    }

    private static KuveytTurkPaymentProcessor CreateProcessor(ECommerceContext db, FakeGateway gateway) =>
        new(db, gateway, NullLogger<KuveytTurkPaymentProcessor>.Instance);

    private static async Task<ECommerceContext> CreateDbAsync(string? databaseName = null)
    {
        databaseName ??= $"kt-{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<ECommerceContext>()
            .UseSqlite($"Data Source={databaseName};Mode=Memory;Cache=Shared")
            .Options;
        var db = new TestContext(options);
        await db.Database.OpenConnectionAsync();
        await db.Database.EnsureCreatedAsync();
        return db;
    }

    private static async Task SeedAsync(
        ECommerceContext db,
        PaymentTransactionState state = PaymentTransactionState.AuthenticationStarted,
        PaymentStatus paymentStatus = PaymentStatus.Pending,
        DateTime? provisioningStartedAtUtc = null)
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
            Status = paymentStatus,
            ProvisioningStartedAtUtc = provisioningStartedAtUtc
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
        private readonly TaskCompletionSource _provisionStarted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource _releaseProvision =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _provisionCalls;

        public KuveytTurkBankResponse Authentication { get; init; } = Response();
        public KuveytTurkBankResponse Provision { get; init; } = Response();
        public bool AuthenticationHashValid { get; init; } = true;
        public bool ProvisionHashValid { get; init; } = true;
        public bool BlockProvision { get; init; }
        public Exception? ProvisionException { get; init; }
        public int ProvisionCalls => Volatile.Read(ref _provisionCalls);

        public KuveytTurkBankResponse ParseAuthenticationResponse(string value) => Authentication;
        public bool VerifyAuthenticationResponse(KuveytTurkBankResponse response) => AuthenticationHashValid;
        public bool VerifyProvisionResponse(KuveytTurkBankResponse response) => ProvisionHashValid;

        public async Task<KuveytTurkBankResponse> ProvisionAsync(
            string merchantOrderId,
            decimal amount,
            string md,
            CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _provisionCalls);
            _provisionStarted.TrySetResult();

            if (ProvisionException is not null)
            {
                throw ProvisionException;
            }

            if (BlockProvision)
            {
                await _releaseProvision.Task.WaitAsync(cancellationToken);
            }

            return Provision;
        }

        public Task WaitUntilProvisionStartedAsync() => _provisionStarted.Task;
        public void ReleaseProvision() => _releaseProvision.TrySetResult();
    }

    private sealed class TestContext(DbContextOptions<ECommerceContext> options)
        : ECommerceContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            foreach (var property in modelBuilder.Model
                         .GetEntityTypes()
                         .SelectMany(entity => entity.GetProperties()))
            {
                if (property.GetColumnType()?.Contains("(max)", StringComparison.OrdinalIgnoreCase) == true)
                {
                    property.SetColumnType("TEXT");
                }
            }

            var rowVersion = modelBuilder.Entity<PaymentTransaction>()
                .Property(x => x.RowVersion);
            rowVersion.HasColumnType("BLOB");
            rowVersion.IsConcurrencyToken(false).ValueGeneratedNever();
            rowVersion.Metadata.SetBeforeSaveBehavior(PropertySaveBehavior.Save);
            rowVersion.Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Save);
        }
    }
}
