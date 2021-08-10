const mongodb = require("mongodb");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;

const UserGoogleSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectID,
                    ref: "ProductModel",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
});

UserGoogleSchema.methods.authTokenGeneration = async function () {
    try {
        console.log("JWT THIS: ", this);
        const userToken = jwt.sign(
            {
                email: this.email.toString(),
                username: this.email.toString(),
                googleToken: this.googleToken.toString(),
            },
            process.env.SECRET_KEY
        );
        this.tokens.push({
            token: userToken,
        });
        console.log(this.tokens);
        await this.save();
        return userToken;
    } catch (error) {
        console.log(error);
    }
};

UserGoogleSchema.methods.addToCart = function (product) {
    console.log("In User cart function");
    const existingProductIndex = this.cart.items.findIndex(
        (cItem) => cItem.productId.toString() === product._id.toString()
    );
    let newQuantity = 1;
    const newCartItems = [...this.cart.items];
    if (existingProductIndex >= 0) {
        newQuantity = this.cart.items[existingProductIndex].quantity + 1;
        newCartItems[existingProductIndex].quantity = newQuantity;
    } else {
        newCartItems.push({
            productId: product._id,
            quantity: 1,
        });
    }
    const newCart = {
        items: newCartItems,
    };
    console.log(newCart);
    this.cart = newCart;
    return this.save();
};

UserGoogleSchema.methods.deleteCartProduct = function (product) {
    console.log("this: ",this);
    console.log("DeleteCartProduct: ", product._id);
    const newCartItems = this.cart.items.filter(
        (cItem) =>{
            console.log((cItem), " ", (cItem.productId.toString() !== product._id.toString()));
            return (cItem.productId !== null &&
            cItem._id.toString() !== product._id.toString())}
    );
    this.cart.items = newCartItems;
    return this.save();
};

UserGoogleSchema.methods.deleteCartProductByBook = function (product) {
    console.log("DELETE_CART_BY_BOOK: ", product._id);
    const newCartItems = this.cart.items.filter(
        (cItem) =>
            cItem.productId !== null &&
            cItem.productId.toString() !== product._id.toString()
    );
    this.cart.items = newCartItems;
    return this.save();
};

UserGoogleSchema.methods.decrementQuantity = function (product) {
    // console.log("Decrementing Cart product: ", product);
    const newCartItems = this.cart.items.filter((cItem) => {
        /* console.log(
            cItem.productId._id.toString() +
                " === " +
                product.productId._id.toString()
        ); */
        return (
            cItem.productId !== null &&
            cItem.productId._id.toString() !== product.productId._id.toString()
        );
    });
    console.log({
        productId: product.productId._id.toString(),
        quantity: product.productId.quantity.toString(),
    });
    newCartItems.push({
        _id: product._id,
        productId: product.productId._id,
        quantity: product.productId.quantity,
    });
    this.cart.items = newCartItems;
    this.save();

    let temp = product;
    temp.quantity = temp.productId.quantity;
    // console.log("temp: ", temp);
    return temp;
};

module.exports = mongoose.model("UserGoogle", UserGoogleSchema);