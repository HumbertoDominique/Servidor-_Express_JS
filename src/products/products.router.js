import { Router } from "express";
import { isUpdate } from "../middleware/realTimeProducts.middleware.js";

import {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} from "./products.controller.js";

const productsRouter = Router();

productsRouter.get("/", isUpdate, getProducts);

productsRouter.get("/:pid", isUpdate, getProductById);

productsRouter.post("/", isUpdate, addProduct);

productsRouter.put("/:pid", isUpdate, updateProduct);

productsRouter.delete("/:pid", isUpdate, deleteProduct);

export { productsRouter };
