export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Shipped"
  | "Delivered"
  | "Completed"
  | "Cancelled";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded"
  | "Cancelled";

export function orderStatusLabel(status: string) {
  switch (status) {
    case "Pending":
      return "Beklemede";
    case "Preparing":
      return "Hazırlanıyor";
    case "Shipped":
      return "Kargoya Verildi";
    case "Delivered":
      return "Teslim Edildi";
    case "Completed":
      return "Tamamlandı";
    case "Cancelled":
      return "İptal Edildi";
    default:
      return status;
  }
}

export function paymentStatusLabel(status: string) {
  switch (status) {
    case "Pending":
      return "Ödeme Bekliyor";
    case "Paid":
      return "Ödendi";
    case "Failed":
      return "Başarısız";
    case "Refunded":
      return "İade Edildi";
    case "Cancelled":
      return "İptal Edildi";
    default:
      return status;
  }
}

export function orderStatusTone(status: string) {
  switch (status) {
    case "Pending":
      return "warning";
    case "Preparing":
      return "info";
    case "Shipped":
      return "info";
    case "Delivered":
      return "success";
    case "Completed":
      return "success";
    case "Cancelled":
      return "danger";
    default:
      return "muted";
  }
}

export function paymentStatusTone(status: string) {
  switch (status) {
    case "Pending":
      return "warning";
    case "Paid":
      return "success";
    case "Failed":
      return "danger";
    case "Refunded":
      return "info";
    case "Cancelled":
      return "danger";
    default:
      return "muted";
  }
}