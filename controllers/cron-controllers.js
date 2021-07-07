const HttpError = require('../models/http-error');
const Product = require('../models/product');
const axios = require('axios').default;


async function updateProducts(docs) {
  docs.foreach(async doc=>{
    try {
      const response = await axios.get(`http://aries.delyclar.com//individual/clar3901/${doc.sku}`);
      let objToUpdate={
        "sku":doc.sku,
        "price":response.data["PRECIO_A"],
        "quantity":response.data["EXISTENCIA"]
      };
      const wixUpdateResult=await axios.put(`https://firoos.wixsite.com/delypruebas/_functions/updateBySku`,objToUpdate);

      await Product.updateOne({ SKU: doc.sku }, {
        Price: response.data["PRECIO_A"],
        "In Stock": response.data["EXISTENCIA"]
      });
    } catch (error) {
      console.error(error);
    }
  });
}

const syncProducts = async () => {
  let products;
  try {
    products = await Product.find({},[]);
    let results=products.map(product => product.toObject({ getters: true }));
    updateProducts(results);
  } catch (error) {
    console.error(error);
  }
};
exports.syncProducts = syncProducts;