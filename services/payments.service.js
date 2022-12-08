const mercadoPagoApi = require('../api/mercadoPagoApi');

class PaymentsService {

    async createPayment({ products, user_email }) {

        try {

            let items = [];

            products.forEach((e) => items = [...items, {
                title: e.name,
                description: e.description,
                picture_url: e.img[0].imageUrl,
                category_id: e.category._id,
                quantity: 1,
                unit_price: 10
                // unit_price: e.price
            }])

            const { data } = await await mercadoPagoApi.post("", {
                payer_email: user_email,
                items,
                back_urls: {
                  success: "https://my-ecommerce-app-vite.netlify.app/cart",
                  failure: "https://my-ecommerce-app-vite.netlify.app/",    
                  pending: "https://my-ecommerce-app-vite.netlify.app/"
                }
              });

            return data;
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = PaymentsService;