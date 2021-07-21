const HttpError = require('../models/http-error');
const Product = require('../models/product');
const Variant = require('../models/variant');
const axios = require('axios').default;

sleep=(ms)=>{
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

updateWixStock = async (sku, price, quantity) => {
  let objToUpdate = {
    sku, price, quantity
  };
  const wixResult = await axios.put(`https://firoos.wixsite.com/delypruebas/_functions/updateBySku`, objToUpdate);
  
  console.log("se ejecuta la peticioin",wixResult);
}


getStockToUpdate = async (prod) => {
  let stockNew=0;
  let price=0;

  const ariesQuery = await axios.get(`http://aries.delyclar.com//individual/clar3901/${prod.SKU}`);
  if(ariesQuery.data!==null){
  if(typeof ariesQuery.data["PRECIO_A"]!=="undefined")
  {
  price=ariesQuery.data["PRECIO_A"];
  let existenciaPadre = 0;
  
  stockNew = parseInt(ariesQuery.data["EXISTENCIA"]);
  if (typeof ariesQuery.data["TRANS_NIVEL_PRODUCTO"] !== "undefined"&&
  typeof ariesQuery.data["TRANS_COD_PADRE"] !== "undefined"&&
  typeof ariesQuery.data["TRANS_CANTIDAD_HIJO"] !== "undefined"
  ){
    let nivelProducto = parseInt(ariesQuery.data["TRANS_NIVEL_PRODUCTO"]);
    let codPadre = ariesQuery.data["TRANS_COD_PADRE"];
    let cantidadHijo = parseInt(ariesQuery.data["TRANS_CANTIDAD_HIJO"]);
  while (nivelProducto !== 1) {
    const superiorQuery = await axios.get(`http://aries.delyclar.com//individual/clar3901/${codPadre}`);
    nivelProducto = parseInt(superiorQuery.data["TRANS_NIVEL_PRODUCTO"]);
    codPadre = superiorQuery.data["TRANS_COD_PADRE"];
    existenciaPadre = superiorQuery.data["EXISTENCIA"];
  }
  if (cantidadHijo !== 0) stockNew = existenciaPadre * cantidadHijo;
  }
}
  }


return {stockNew,price};
}

async function updateProducts(docs) {
  for (let x in docs) {
   await sleep(1000);
    let doc = docs[x];
    try {
      if (doc.TrackInventory) {
        if (doc.ManageVariants) {
          let variantObj = await Variant.find({ ProductId: doc["_id"] }, []);
          let variants = variantObj.map(variant => variant.toObject({ getters: true }));
          for (let y in variants) {
            await sleep(1000);
            let variant = variants[y];
            let currentPrice = getStockToUpdate(variant);
            if (currentPrice.stockNew !== doc.QuantityInStock) {
              let updateVariant = await Product.findOneAndUpdate({ "_id": variantObj["_id"] }, { "QuantityInStock": currentPrice.stockNew }, {
                returnOriginal: false
              });
              this.updateWixStock(doc.sku, doc.discountedPrice, stockNew);
            }
          }

        }
        else {
          let currentPrice = getStockToUpdate(doc);
          if (doc.QuantityInStock !== stockNew) {
            let updateProduct = await Product.findOneAndUpdate({ "SKU": "0802986226025" },
              { "Price": rcurrentPrice.price, "QuantityInStock": currentPrice.stockNew }, {
              returnOriginal: false
            });
            this.updateWixStock(doc.sku, doc.discountedPrice, stockNew);
          }
        }

      }
    } catch (error) {
      //console.error(error);
    }
  }
}
const syncProducts = async () => {
  let products;
  try {
    products = await Product.find({}, []);
    this.updateWixStock("0802986226025", 12, 10);
    let results = products.map(product => product.toObject({ getters: true }));
    updateProducts(results);
  } catch (error) {
    //console.error(error);
  }
};
exports.syncProducts = syncProducts;
