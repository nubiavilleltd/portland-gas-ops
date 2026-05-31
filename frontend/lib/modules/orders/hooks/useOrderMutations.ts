
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersService } from "../services/orders.service";
import { ORDER_KEYS } from "../constants/query-keys";
import { Order } from "../types/orders.types";

// export function useConfirmOrder() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: OrdersService.confirmOrder,

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ORDER_KEYS.orders,
//       });
//     },
//   });
// }



export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: OrdersService.confirmOrder,

    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(
        ORDER_KEYS.detail(updatedOrder.id),
        updatedOrder
      );

      queryClient.setQueryData(
        ORDER_KEYS.lists(),
        (old?: Order[]) =>
          old?.map(o =>
            o.id === updatedOrder.id ? updatedOrder : o
          )
      );
    },
  });
}