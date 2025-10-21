export const availablePaymentMethods = {
    'banpro': 'Banpro',
    'lafise': 'Lafise',
    'bac': 'BAC',
    'ficohsa': 'Ficohsa',
    'billetera_movil': 'Billetera Móvil',
    'envio_veloz': 'Envío Veloz',
    'paypal': 'PayPal',
    'stripe': 'Stripe',
    'payoneer': 'Payoneer',
    'moneygram': 'MoneyGram',
    'xoom': 'Xoom',
    'ria': 'Ria Money Transfer',
    'efectivo': 'Efectivo'
};

export const state = {
    storeState: {},
    cart: {},
    activeProductId: null,
    activeProductImage: null,
    token: localStorage.getItem('jwt_token')
};
