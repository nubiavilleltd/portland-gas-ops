export function canUserConfirmDelivery(
    order: Order,
    user: CurrentUser,
) {
    if (user.role === "super_admin") {
        return true;
    }

    if (user.role === "admin") {
        return true;
    }

    return order.driverId === user.employeeId;
}