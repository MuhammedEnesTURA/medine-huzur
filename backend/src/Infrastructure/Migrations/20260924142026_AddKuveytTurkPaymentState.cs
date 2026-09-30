using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddKuveytTurkPaymentState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankOrderId",
                table: "PaymentTransactions",
                type: "nvarchar(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessKey",
                table: "PaymentTransactions",
                type: "nvarchar(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MerchantOrderId",
                table: "PaymentTransactions",
                type: "nvarchar(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProvisioningStartedAtUtc",
                table: "PaymentTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProvisionNumber",
                table: "PaymentTransactions",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResponseCode",
                table: "PaymentTransactions",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResponseMessage",
                table: "PaymentTransactions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "PaymentTransactions",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "Rrn",
                table: "PaymentTransactions",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Stan",
                table: "PaymentTransactions",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "PaymentTransactions",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Created");

            migrationBuilder.AddColumn<DateTime>(
                name: "TransactionTime",
                table: "PaymentTransactions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_MerchantOrderId",
                table: "PaymentTransactions",
                column: "MerchantOrderId",
                unique: true,
                filter: "[MerchantOrderId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentTransactions_MerchantOrderId",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "BankOrderId",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "BusinessKey",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "MerchantOrderId",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ProvisioningStartedAtUtc",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ProvisionNumber",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ResponseCode",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ResponseMessage",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "Rrn",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "Stan",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "State",
                table: "PaymentTransactions");

            migrationBuilder.DropColumn(
                name: "TransactionTime",
                table: "PaymentTransactions");
        }
    }
}
