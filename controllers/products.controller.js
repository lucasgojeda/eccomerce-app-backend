const { response, request } = require("express");
const { ObjectId } = require('mongoose').Types;
const { sortArray } = require("../helpers/sortArrays");

const { Product, Category } = require("../models");
const { recordCreate } = require("./record.controller");


const getListProducts = async (req = request, res = response) => {

    try {
        const { term } = req.params;
        const { page, orderBy, filterBy } = req.query;
        const limit = page * 8;
        const since = (page * 8) - 8;
        const isMongoId = ObjectId.isValid(term);


        // if term is a mongoId or 'indumentaria'
        if (isMongoId && term !== 'indumentaria') {

            const product = await Product.findById(term)
                .populate('category', 'name')
                .populate('user', 'name');


            return res.json({
                results: (product) ? [product] : []
            })
        };

        // if term is not empty
        if (term !== 'home') {

            var categoryForProduct = await Category.find({ name: term })

            const regex = new RegExp(term, 'i');

            // if there is a category to filter
            if (categoryForProduct.length !== 0) {
                const products = await Product.find({
                    $or: [{ name: regex }, { category: categoryForProduct[0]?._id }],
                    $and: [{ status: true }]
                }).populate('category', 'name')
                    .populate('user', 'name')


                // we filter and order results
                let filteredProducts = sortArray( products, orderBy, filterBy);
                
                // we paginate results
                var results = [];
                filteredProducts.forEach((e, i) => (i >= since && i < limit) && results.push(e))


                return res.json({
                    msg: 'OK',
                    results
                })
            } else {

                //if there is not a category to filter
                const products = await Product.find({ name: regex, status: true })
                    .populate('category', 'name')
                    .populate('user', 'name')

                // we filter and order results
                // const filteredProducts = sortArray(products, {
                //     by: filterBy,
                //     order: orderBy
                // })

                let filteredProducts = sortArray( products, orderBy, filterBy);


                // we paginate results
                var results = [];
                filteredProducts.forEach((e, i) => (i >= since && i < limit) && results.push(e))


                return res.json({
                    msg: 'OK',
                    results,
                })
            }

        } else {

            //if term is empty
            const products = await Product.find({ status: true })
                .populate('category', 'name')
                .populate('user', 'name')


            // we filter and order results
            // const filteredProducts = sortArray(products, {
            //     by: filterBy,
            //     order: orderBy
            // })

            let filteredProducts = sortArray( products, orderBy, filterBy);

            // we paginate results
            var results = [];
            filteredProducts.forEach((e, i) => (i >= since && i < limit) && results.push(e))


            res.json({
                msg: 'OK',
                results
            })

        }
    } catch (error) {
        res.json({
            msg: error
        })
        console.log(error)
    }



}

const getProductById = async (req, res = response) => {

    const { id } = req.params;

    try {
        const product = await Product.findById(id)
            .populate('user', 'name')
            .populate('category', 'name');

        if (!product || !product.status) {
            return res.status(400).json({
                msg: `There is no product with the id: ${id}`
            })
        }

        res.json({
            msg: 'OK',
            product
        })

    } catch (error) {
        res.json({
            msg: error
        })
        console.log(error)
    }
}

const createProduct = async (req, res = response) => {

    const { status, user, ...body } = req.body;
    const { name, quantity, description, category, price, img } = body;
    name.toUpperCase();


    try {

        const [productDB, categoryDB] = await Promise.all([
            Product.findOne({ name }),
            Category.findOne({ name: category })
        ]);


        if (!categoryDB) {
            return res.status(400).json({
                msg: `The category ${category} does not exist!`
            });
        }

        if (productDB) {
            return res.status(400).json({
                msg: `The product ${productDB.name} already exists!`
            });
        }

        const data = {
            name,
            category: categoryDB._id,
            description,
            quantity,
            price,
            img,
            user: req.user._id
        }

        const productNew = new Product(data);

        const productSaved = await productNew.save();

        const [record, product] = await Promise.all([
            recordCreate({
                name: productNew.name,
                type: 'PRODUCT',
                action: 'CREATE',
                date: Date.now(),
                user: req.user._id,
                details: {
                    name: productSaved.name,
                    category: {
                        _id: productSaved.category._id,
                        name: productSaved.category.name
                    },
                    quantity: productSaved.quantity,
                    description: productSaved.description,
                    price: productSaved.price,
                    img: productSaved.img,
                    user: productSaved.user
                }
            }),
            Product.findById(productSaved._id).populate('category', 'name')

        ])


        res.status(201).json({
            msg: 'OK',
            product,
            record
        })

    } catch (error) {
        res.status(401).json({
            msg: 'The product could not be processed - create product failed'
        })
        console.log(error)

    }
}

const updateProduct = async (req, res = response) => {

    const { id } = req.params;

    try {

        const { product } = req.body;

        const { category } = product;

        const productDB = await Product.findById(id).populate('category', 'name')

        const categoryDB = await Category.findOne({ name: category })


        if (!productDB) {
            return res.status(400).json({
                msg: `The product with the id ${id} does not exist!`
            });
        }

        if (!categoryDB) {
            return res.status(400).json({
                msg: `The category ${categoryDB} does not exist!`
            });
        }

        const data = {
            name: product.name,
            category: categoryDB._id,
            quantity: product.quantity,
            description: product.description,
            price: product.price,
            img: product.img,
            user: req.user._id
        }


        const productFinish = await Product.findByIdAndUpdate(id, data, { new: true })
            .populate('category', 'name')
            .populate('user', 'name')

        const record = await recordCreate({
            name: data.name,
            type: 'PRODUCT',
            action: 'UPDATE',
            date: Date.now(),
            user: req.user._id,
            details: {
                before: {
                    name: productDB.name,
                    category: {
                        _id: productDB.category._id,
                        name: productDB.category.name
                    },
                    quantity: productDB.quantity,
                    description: productDB.description,
                    price: productDB.price,
                    img: productDB.img,
                    user: productDB.user
                },
                after: {
                    name: productFinish.name,
                    category: {
                        _id: productFinish.category._id,
                        name: productFinish.category.name
                    },
                    quantity: productFinish.quantity,
                    description: productFinish.description,
                    price: productFinish.price,
                    img: productFinish.img,
                    user: productFinish.user
                }
            }
        })



        res.status(201).json({
            msg: 'OK',
            product: productFinish,
            record
        })

    } catch (error) {

        res.status(401).json({
            msg: 'The product could not be processed'
        })
        console.log(error)

    }
}

const deleteProduct = async (req, res = response) => {

    try {

        const id = req.params.id;

        const product = await Product.findByIdAndUpdate(id, { status: false }, { new: true }).populate('category', 'name')

        const record = await recordCreate({
            name: product.name,
            type: 'PRODUCT',
            action: 'DELETE',
            date: Date.now(),
            user: req.user._id,
            details: {
                name: product.name,
                category: {
                    _id: product.category._id,
                    name: product.category.name
                },
                quantity: product.quantity,
                description: product.description,
                price: product.price,
                img: product.img,
                user: product.user
            }
        })

        res.status(200).json({
            msg: 'OK',
            product,
            record
        })

    } catch (error) {
        res.status(200).json({
            msg: error
        })
        console.log(error)
    }
}

module.exports = {
    createProduct,
    getListProducts,
    getProductById,
    updateProduct,
    deleteProduct
}