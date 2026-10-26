import { request as pwRequest } from '@playwright/test';
import { getBackendAdminToken } from '../core/backend-admin-auth';
import { signedBackendHeadersFullUrl } from '../core/backend-api-signature-fullurl'

const ORDER_STATUS_PATH = '/api/order/all-order-status';
const BASE_URL = 'https://emi-backend-api.gfau.augmont.com';

export interface OrderStatusRequest extends Record<string, unknown> {
  orderId: number | string;
  status: string;
}

export async function updateOrderStatus(body: OrderStatusRequest): Promise<any> {
  const token = await getBackendAdminToken();
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });

  try {
    const res = await ctx.post(ORDER_STATUS_PATH, {
      headers: signedBackendHeadersFullUrl(
        token,
        'POST',
        BASE_URL,
        ORDER_STATUS_PATH,
        body,
      ),
      data: body,
    });

    const text = await res.text();

    if (!res.ok()) {
      throw new Error(`POST ${ORDER_STATUS_PATH} failed: ${res.status()} ${text}`);
    }

    return JSON.parse(text);
  } finally {
    await ctx.dispose();
  }
}

export async function getOrderStatuses(): Promise<any> {
  const token = await getBackendAdminToken();

  const ctx = await pwRequest.newContext({
    baseURL: BASE_URL,
  });

  try {
    const res = await ctx.get(ORDER_STATUS_PATH, {
      headers: signedBackendHeadersFullUrl(
        token,
        'GET',
        BASE_URL,
        ORDER_STATUS_PATH,
      ),
    });

    const text = await res.text();

    if (!res.ok()) {
      throw new Error(
        `GET ${ORDER_STATUS_PATH} failed: ${res.status()} ${text}`,
      );
    }

    return JSON.parse(text);
  } finally {
    await ctx.dispose();
  }
}

export async function getOrdersByStatus(
  orderCurrentStatus: number,
  page = 1,
  from = 1,
  to = 25,
): Promise<any> {
  const token = await getBackendAdminToken();

  const path =
    `/api/order/v2?from=${from}&to=${to}` +
    `&orderCurrentStatus=${orderCurrentStatus}` +
    `&page=${page}`;

  const ctx = await pwRequest.newContext({
    baseURL: BASE_URL,
  });

  try {
    const res = await ctx.get(path, {
      headers: signedBackendHeadersFullUrl(
        token,
        'GET',
        BASE_URL,
        path,
      ),
    });

    const text = await res.text();

    if (!res.ok()) {
      throw new Error(
        `GET ${path} failed: ${res.status()} ${text}`,
      );
    }

    return JSON.parse(text);
  } finally {
    await ctx.dispose();
  }
}
// export interface AdminCancelOrderRequest extends Record<string, unknown> {
//   storeId: string;
//   orderId: number;
//   userId: string;
//   customerName: string;
//   mobileNumber: string;
//   bookingPrice: number;
//   totalAmt: string;
//   cancellationPrice: number;
//   differenceAmt: string;
//   totalCancellationCharges: string;
//   amtPayable: string;
//   cancellationCharges: number;
//   passbookId: string | null;
//   checkCopyId: string | null;
//   nextStatus: string;
//   amountTransferTo: string;
// }

// export async function adminCancelOrder(
//   orderId: number,
//   body: AdminCancelOrderRequest,
// ): Promise<any> {
//   const token = await getBackendAdminToken();

//   const path = `/api/cancel-order/admin-cancel-order/${orderId}`;

//   const ctx = await pwRequest.newContext({
//     baseURL: BASE_URL,
//   });

//   try {
//     const res = await ctx.post(path, {
//       headers: signedBackendHeadersFullUrl(
//         token,
//         'POST',
//         BASE_URL,
//         path,
//         body,
//       ),
//       data: body,
//     });

//     const text = await res.text();

//     if (!res.ok()) {
//       throw new Error(
//         `POST ${path} failed: ${res.status()} ${text}`,
//       );
//     }

//     return text ? JSON.parse(text) : {};
//   } finally {
//     await ctx.dispose();
//   }
// }

export async function getOrderByUniqueId(
  orderUniqueId: number | string,
): Promise<any> {
  const token = await getBackendAdminToken();

  const path =
    `/api/order/v2?from=1&to=25` +
    `&orderUniqueId=${orderUniqueId}` +
    `&page=1`;

  const ctx = await pwRequest.newContext({
    baseURL: BASE_URL,
  });

  try {
    const res = await ctx.get(path, {
      headers: signedBackendHeadersFullUrl(
        token,
        'GET',
        BASE_URL,
        path,
      ),
    });

    const text = await res.text();

    if (!res.ok()) {
      throw new Error(
        `GET ${path} failed: ${res.status()} ${text}`,
      );
    }

    return JSON.parse(text);
  } finally {
    await ctx.dispose();
  }
}

export interface AdminCancelOrderRequest extends Record<string, unknown> {
  storeId: string;
  orderId: number;
  userId: string;
  customerName: string;
  mobileNumber: string;
  bookingPrice: number;
  totalAmt: string;
  cancellationPrice: number;
  differenceAmt: number;
  totalCancellationCharges: number;
  amtPayable: number;
  cancellationCharges: number;
  passbookId: string | null;
  checkCopyId: string | null;
  nextStatus: string;
  amountTransferTo: string;
}

export async function adminCancelOrder(
  cancelOrderId: number | string,
  body: AdminCancelOrderRequest,
): Promise<any> {
  console.log('=== adminCancelOrder START ===');
  console.log('Order ID:', cancelOrderId);

  const token = await getBackendAdminToken();
  const path = `/api/cancel-order/admin-cancel-order/${cancelOrderId}`;
  const ctx = await pwRequest.newContext({
    baseURL: BASE_URL,
  });

  try {
    const res = await ctx.put(path, {
      headers: signedBackendHeadersFullUrl(
        token,
        'PUT',
        BASE_URL,
        path,
        body,
      ),
      data: body,
    });

    const text = await res.text();
    console.log('Status:', res.status());
console.log('Body:', text);


    if (!res.ok()) {
      throw new Error(
        `PUT ${path} failed: ${res.status()} ${text}`,
      );
    }

    return text ? JSON.parse(text) : {};
  } finally {
    await ctx.dispose();
  }
}