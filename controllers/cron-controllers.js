const HttpError = require('../models/http-error');
const Product = require('../models/product');
const Variant = require('../models/variant');
const axios = require('axios').default;

sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

updateWixStock = async (sku, price, quantity) => {
  console.log("hola");
  let objToUpdate = {
    sku, price, quantity
  };
  const wixResult = await axios.put(`https://firoos.wixsite.com/delypruebas/_functions/updateBySku`, objToUpdate);

  console.log("se ejecuta la peticioin", wixResult);
}


getStockToUpdate = async (prod) => {
  let stockNew = 0;
  let price = 0;

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
    if(superiorQuery!==null){
    nivelProducto = parseInt(superiorQuery.data["TRANS_NIVEL_PRODUCTO"]);
    codPadre = superiorQuery.data["TRANS_COD_PADRE"];
    existenciaPadre = superiorQuery.data["EXISTENCIA"];
    }
    else{
      nivelProducto=1;
    }  }
  if (cantidadHijo !== 0) stockNew = existenciaPadre * cantidadHijo;
  }
}
  }

      stockNew = parseInt(ariesQuery.data["EXISTENCIA"]);
      if (typeof ariesQuery.data["TRANS_NIVEL_PRODUCTO"] !== "undefined" &&
        typeof ariesQuery.data["TRANS_COD_PADRE"] !== "undefined" &&
        typeof ariesQuery.data["TRANS_CANTIDAD_HIJO"] !== "undefined"
      ) {
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

  return { stockNew, price };
}

async function updateLocalAndExternalProduct(sku, stock, price) {
  try {
  let updateProduct = await Product.findOneAndUpdate({ "SKU": sku },
    { "Price": price, "QuantityInStock": stock }, {
    returnOriginal: false
  });
  await updateWixStock(sku, price, stock);
  console.log("estamos actualizando");
}
  catch(error){
    console.error(error);
  }
}

async function updateProducts(docs) {
  for (let x in docs) {
    let doc = docs[x];


    try {
      if (doc.TrackInventory === 'true') {
        if (doc.ManageVariants === 'true') {
          let variantObj = await Variant.find({ ProductId: doc["_id"] }, []);
          let variants = variantObj.map(variant => variant.toObject({ getters: true }));
          let parentStock = 0;

          try {
          for (let y in variants) {

            let variant = variants[y];
            await sleep(500);
            let currentPrice = await getStockToUpdate(variant);
            let localStock = JSON.parse(variant.Stock);
            parentStock += currentPrice.stockNew;
            if (currentPrice.stockNew !== localStock.quantity) {
              //console.log("variante diferente");
              //console.log(variant);
              
              let inStock = currentPrice.stockNew > 0;
              localStock["quantity"]=currentPrice.stockNew;
              localStock["inStock"]=inStock;
              let updateVariant = await Variant.findOneAndUpdate({ "VariantID": variant["VariantID"] },
              {"Stock":JSON.stringify(localStock)}
              , {
                new: true, upsert: false
            });
           
              //await updateWixStock(doc.sku, doc.discountedPrice, stockNew);
            }

          }
        }catch(error){
          console.error(error);
        }
          console.log("avanza");
          await updateLocalAndExternalProduct(doc.sku, parentStock, 12); ///revisar precio a actualizar
        }
        else {
          try {
          let currentPrice = await getStockToUpdate(doc);
          if (doc.QuantityInStock !== currentPrice.stockNew) {
           await updateLocalAndExternalProduct(doc.sku, currentPrice.stockNew, currentPrice.price);

          }
        }catch(error){
          console.error(error);
        }
        }
        await sleep(1000);
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
    let results = products.map(product => product.toObject({ getters: true }));
    updateProducts(results);
  } catch (error) {
    //console.error(error);
  }
};
exports.syncProducts = syncProducts;
