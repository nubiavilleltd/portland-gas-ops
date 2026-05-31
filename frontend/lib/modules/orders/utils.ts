export function generateOrderId(){
    return `order-${Date.now()}`
}


export function generateOrderNumber(){
    return `ORD-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`
}

