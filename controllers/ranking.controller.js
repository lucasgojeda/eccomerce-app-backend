const { response, request } = require("express");
const { ObjectId } = require("mongoose").Types;
const { sortArray } = require("../helpers/sortArrays");

const { Product, Category } = require("../models");
const ranking = require("../models/ranking");
const { recordCreate } = require("./record.controller");

/**
 * Best products
 */

const getBestProducts = async (req = request, res = response) => {
  try {
    const data = await ranking.find().populate("product");

    res.json({
      msg: "OK, bestProducts",
      results: data,
    });
  } catch (error) {
    res.json({
      msg: error,
    });
    console.log(error);
  }
};

const updateBestProducts = async (cart) => {
  try {
    const bestProducts = await ranking.find();

    // let data = [];

    let newData = [
      {
        _id: "622a3df460c0c15e8e44bf5d",
        ranking: 1
      }
    ];

    console.log('Cart: ', cart);

    console.log('Before: ', data);

    // newData.push({
    //   _id: e._id,
    //   ranking: 1
    // })

    cart.forEach((c) => {

      const product = newData.find((d) => d._id === c._id.toString());

      if(product) {

        data = [ ...data, {
          _id: product._id,
          ranking: product.ranking + 1
        }]
      } else {

        data = [ ...data, {
          _id: c._id,
          ranking: 1
        }]
      }
    })

    console.log('After: ', data);
    
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getBestProducts,
  updateBestProducts,
};
