import ProductDAO from "../../src/dao/productDAO";
import dayjs from "dayjs";
import { expect, beforeEach, describe, test, beforeAll } from "@jest/globals";
import db from "../../src/db/db";
import { cleanup } from "../../src/db/cleanup";
import {
  ArrivalDateError,
  EmptyProductStockError,
  FiltersError,
  LowProductStockError,
  ProductAlreadyExistsError,
  ProductNotFoundError,
} from "../../src/errors/productError";
import { Category, Product } from "../../src/components/product";

beforeAll(() => {
  cleanup();
});

describe("ProductDAO integration tests", () => {
  let dao: ProductDAO;

  beforeEach((done) => {
    dao = new ProductDAO();
    db.run("DELETE FROM products", (err) => {
      if (err) {
        console.log(err);
      }
      done();
    });
  });

  const p1 = new Product(
    100.0,
    "Model1",
    Category.SMARTPHONE,
    "2024-01-01",
    "Details1",
    10
  );
  const p2 = new Product(
    200.0,
    "Model2",
    Category.LAPTOP,
    "2024-01-02",
    "Details2",
    20
  );
  const p3 = new Product(
    300.0,
    "Model3",
    Category.APPLIANCE,
    "2024-01-03",
    "Details3",
    30
  );
  const p4 = new Product(
    100.0,
    "Model4",
    Category.SMARTPHONE,
    "2024-01-01",
    "Details1",
    0
  );
  const p5 = new Product(
    200.0,
    "Model5",
    Category.LAPTOP,
    "2024-01-02",
    "Details2",
    0
  );
  const p6 = new Product(
    300.0,
    "Model6",
    Category.APPLIANCE,
    "2024-01-03",
    "Details3",
    0
  );

  /* *********************************************** *
   * Integration test for the registerProducts method *
   * ************************************************ */
  describe("tests for the registerProducts method", () => {
    test("registerProducts should insert a product into the database", async () => {
      const model = p1.model;
      const category = p1.category;
      const quantity = p1.quantity;
      const details = p1.details;
      const sellingPrice = p1.sellingPrice;
      const arrivalDate = p1.arrivalDate;

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate as any
      );

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.model).toBe(model);
        expect(productRow.category).toBe(category);
        expect(productRow.quantity).toBe(quantity);
        expect(productRow.details).toBe(details);
        expect(productRow.sellingPrice).toBe(sellingPrice);
        expect(productRow.arrivalDate).toBe(arrivalDate);
      });
    });

    test("registerProducts should insert a product into the database if detatails are not provided", async () => {
      const model = p2.model;
      const category = p2.category;
      const quantity = p2.quantity;
      const sellingPrice = p2.sellingPrice;
      const arrivalDate = p2.arrivalDate;

      await dao.registerProducts(
        model,
        category,
        quantity,
        null,
        sellingPrice,
        arrivalDate as any
      );

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.model).toBe(model);
        expect(productRow.category).toBe(category);
        expect(productRow.quantity).toBe(quantity);
        expect(productRow.details).toBe(null);
        expect(productRow.sellingPrice).toBe(sellingPrice);
        expect(productRow.arrivalDate).toBe(arrivalDate);
      });
    });

    test("registerProducts should insert a product into the database if arrivalDate is not provided", async () => {
      const model = p3.model;
      const category = p3.category;
      const quantity = p3.quantity;
      const details = p3.details;
      const sellingPrice = p3.sellingPrice;

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        null as any
      );

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.model).toBe(model);
        expect(productRow.category).toBe(category);
        expect(productRow.quantity).toBe(quantity);
        expect(productRow.details).toBe(details);
        expect(productRow.sellingPrice).toBe(sellingPrice);
        expect(productRow.arrivalDate).toStrictEqual(
          dayjs().format("YYYY-MM-DD")
        );
      });
    });

    test("registerProducts should throw ProductAlreadyExistsError error if the product already exists", async () => {
      const model = p1.model;
      const category = p1.category;
      const quantity = p1.quantity;
      const details = p1.details;
      const sellingPrice = p1.sellingPrice;
      const arrivalDate = p1.arrivalDate;

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate as any
      );

      await expect(
        dao.registerProducts(
          model,
          category,
          quantity,
          details,
          sellingPrice,
          arrivalDate as any
        )
      ).rejects.toThrow(ProductAlreadyExistsError);
    });
  });
  /* **************************************************** *
   * Integration test for the changeProductQuantity method *
   * ***************************************************** */
  describe("tests for the changeProductQuantity method", () => {
    test("changeProductQuantity should update the quantity of a product in the database", async () => {
      const model = p1.model;
      const category = p1.category;
      const quantity = p1.quantity;
      const details = p1.details;
      const sellingPrice = p1.sellingPrice;
      const arrivalDate = p1.arrivalDate;

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate as any
      );

      const newQuantity = 20;
      const changeDate = dayjs().format("YYYY-MM-DD");

      const ret = await dao.changeProductQuantity(
        model,
        newQuantity,
        changeDate
      );
      expect(ret).toBe(quantity + newQuantity);

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.quantity).toBe(quantity + newQuantity);
      });
    });

    test("changeProductQuantity should update the quantity of a product in the database", async () => {
      const model = p2.model;
      const category = p2.category;
      const quantity = p2.quantity;
      const details = p2.details;
      const sellingPrice = p2.sellingPrice;
      const arrivalDate = p2.arrivalDate;

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate as any
      );

      const newQuantity = 20;

      await dao.changeProductQuantity(
        model,
        newQuantity,
        dayjs().format("YYYY-MM-DD")
      );

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.quantity).toBe(quantity + newQuantity);
        expect(productRow.arrivalDate).toBe(dayjs().format("YYYY-MM-DD"));
      });
    });

    test("changeProductQuantity should throw an error if the product does not exist", async () => {
      const model = p3.model;
      const newQuantity = 20;
      const changeDate = dayjs().format("YYYY-MM-DD");

      await expect(
        dao.changeProductQuantity(model, newQuantity, changeDate)
      ).rejects.toThrow(ProductNotFoundError);
    });

    test("changeProductQuantity should throw an error if the changeDate is in the future", async () => {
      const model = p1.model;
      const category = p1.category;
      const quantity = p1.quantity;
      const details = p1.details;
      const sellingPrice = p1.sellingPrice;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const newQuantity = 20;
      const changeDate = dayjs().add(1, "day").format("YYYY-MM-DD");

      await expect(
        dao.changeProductQuantity(model, newQuantity, changeDate)
      ).rejects.toThrow(ArrivalDateError);
    });

    test("changeProductQuantity should throw an error if changeDate is before arrivalDate", async () => {
      const model = p2.model;
      const category = p2.category;
      const quantity = p2.quantity;
      const details = p2.details;
      const sellingPrice = p2.sellingPrice;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const newQuantity = 20;
      const changeDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");

      await expect(
        dao.changeProductQuantity(model, newQuantity, changeDate)
      ).rejects.toThrow(ArrivalDateError);
    });
  });

  /* ******************************************* *
   * Integration test for the sellProduct method *
   * ******************************************* */
  describe("tests for the sellProduct method", () => {
    test("sellProduct should update the quantity of a product in the database", async () => {
      const model = "model1";
      const category = "Smartphone";
      const quantity = 10;
      const details = "details";
      const sellingPrice = 100.0;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const soldQuantity = 5;
      const sellDate = dayjs().format("YYYY-MM-DD");

      const ret = await dao.sellProduct(model, soldQuantity, sellDate);
      expect(ret).toBe(quantity - soldQuantity);

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.quantity).toBe(quantity - soldQuantity);
      });
    });

    test("sellProduct should update the quantity of a product in the database with sellDate set to the current date if not provided", async () => {
      const model = "model1";
      const category = "Smartphone";
      const quantity = 10;
      const details = "details";
      const sellingPrice = 100.0;
      const arrivalDate = "2024-01-01";

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const soldQuantity = 5;

      await dao.sellProduct(model, soldQuantity, null);

      db.get("SELECT * FROM products WHERE model = ?", [model], (err, row) => {
        const productRow = row as {
          model: string;
          category: string;
          quantity: number;
          details: string;
          sellingPrice: number;
          arrivalDate: string;
        };

        expect(productRow.quantity).toBe(quantity - soldQuantity);
      });
    });

    test("sellProduct should throw an error if the product does not exist", async () => {
      const model = "model1";
      const soldQuantity = 5;
      const sellDate = dayjs().format("YYYY-MM-DD");

      await expect(
        dao.sellProduct(model, soldQuantity, sellDate)
      ).rejects.toThrow(ProductNotFoundError);
    });

    test("sellProduct should throw an error if the sellDate is in the future", async () => {
      const model = "model1";
      const category = "Smartphone";
      const quantity = 10;
      const details = "details";
      const sellingPrice = 100.0;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const soldQuantity = 5;
      const sellDate = dayjs().add(1, "day").format("YYYY-MM-DD");

      await expect(
        dao.sellProduct(model, soldQuantity, sellDate)
      ).rejects.toThrow(ArrivalDateError);
    });

    test("sellProduct should throw an error if sellDate is before arrivalDate", async () => {
      const model = "model1";
      const category = "Smartphone";
      const quantity = 10;
      const details = "details";
      const sellingPrice = 100.0;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const soldQuantity = 5;
      const sellDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");

      await expect(
        dao.sellProduct(model, soldQuantity, sellDate)
      ).rejects.toThrow(ArrivalDateError);
    });

    test("sellProduct should throw an error if the quantity in stock is zero", async () => {
      const model = "model1";
      const category = "Smartphone";
      const quantity = 0;
      const details = "details";
      const sellingPrice = 100.0;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const soldQuantity = 5;
      const sellDate = dayjs().format("YYYY-MM-DD");

      await expect(
        dao.sellProduct(model, soldQuantity, sellDate)
      ).rejects.toThrow(EmptyProductStockError);
    });

    test("sellProduct should throw an error if the quantity to sell is greater than the quantity in stock", async () => {
      const model = "model1";
      const category = "Smartphone";
      const quantity = 10;
      const details = "details";
      const sellingPrice = 100.0;
      const arrivalDate = dayjs().format("YYYY-MM-DD");

      await dao.registerProducts(
        model,
        category,
        quantity,
        details,
        sellingPrice,
        arrivalDate
      );

      const soldQuantity = 15;
      const sellDate = dayjs().format("YYYY-MM-DD");

      await expect(
        dao.sellProduct(model, soldQuantity, sellDate)
      ).rejects.toThrow(LowProductStockError);
    });
  });

  /* ***************************************** *
   * Integration test for the getProducts method *
   * ****************************************** */
  describe("tests for the getProducts method", () => {
    test("getProduct should return the product from the database", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      const product = await dao.getProducts(null, null, null);
      expect(product).toEqual([p1, p2, p3]);
    });

    test("getProduct should return the product from the database filtered by model", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      const product = await dao.getProducts("model", null, p2.model);
      expect(product).toEqual([p2]);
    });

    test("getProduct should return the product from the database filtered by category", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      const product = await dao.getProducts("category", p2.category, null);
      expect(product).toEqual([p2]);
    });

    test("getProduct should throw an error if grouping is not a valid field", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await expect(
        dao.getProducts("invalidField", null, p2.model)
      ).rejects.toThrow(FiltersError);
    });

    test("getProduct should throw an error if the grouping is set to model but a model is not provided", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await expect(dao.getProducts("model", null, null)).rejects.toThrow(
        FiltersError
      );
    });

    test("getProduct should throw an error if the grouping is set to category but a category is not provided", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await expect(dao.getProducts("category", null, null)).rejects.toThrow(
        FiltersError
      );
    });

    test("getProduct should throw an error if both model and category are provided", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await expect(
        dao.getProducts("model", "category", p2.model)
      ).rejects.toThrow(FiltersError);
    });

    test("getProduct should throw an error if the category does not exist", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await expect(
        dao.getProducts("category", null, "invalidCategory")
      ).rejects.toThrow(FiltersError);
    });

    test("getProduct should throw an error if the model does not exist", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await expect(
        dao.getProducts("model", null, "invalidModel")
      ).rejects.toThrow(ProductNotFoundError);
    });
  });
  /* **************************************************** *
   * Integration test for the getAvailableProducts method *
   * **************************************************** */
  describe("tests for the getAvailableProducts method", () => {
    test("getAvailableProduct should return the product with quantity is > 0 from the database", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      const product = await dao.getAvailableProducts(null, null, null);
      expect(product).toEqual([p1, p2, p3]);
    });

    test("getAvailableProduct should return the product from the database filtered by model", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      const product = await dao.getAvailableProducts("model", null, p2.model);
      expect(product).toEqual([p2]);
    });

    test("getAvailableProduct should return the product from the database filtered by category", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      const product = await dao.getAvailableProducts(
        "category",
        p2.category,
        null
      );
      expect(product).toEqual([p2]);
    });

    test("getAvailableProduct should return an empty array if no model is available", async () => {
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      const product = await dao.getAvailableProducts(null, null, null);
      expect(product).toEqual([]);
    });

    test("getAvailableProduct should return an empty array if no model is available for the specified category", async () => {
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      const product = await dao.getAvailableProducts(
        "category",
        p4.category,
        null
      );
      expect(product).toEqual([]);
    });

    test("getAvailableProduct should throw an error if the model requested is not available", async () => {
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("model", null, p4.model)
      ).rejects.toThrow(EmptyProductStockError);
    });

    test("getAvailableProduct should throw an error if grouping is not a valid field", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("invalidField", null, p2.model)
      ).rejects.toThrow(FiltersError);
    });

    test("getAvailableProduct should throw an error if the grouping is set to model but a model is not provided", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("model", null, null)
      ).rejects.toThrow(FiltersError);
    });

    test("getAvailableProduct should throw an error if the grouping is set to category but a category is not provided", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("category", null, null)
      ).rejects.toThrow(FiltersError);
    });

    test("getAvailableProduct should throw an error if both model and category are provided", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("model", "category", p2.model)
      ).rejects.toThrow(FiltersError);
    });

    test("getAvailableProduct should throw an error if the category does not exist", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("category", null, "invalidCategory")
      ).rejects.toThrow(FiltersError);
    });

    test("getAvailableProduct should throw an error if the model does not exist", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );
      await dao.registerProducts(
        p4.model,
        p4.category,
        p4.quantity,
        p4.details,
        p4.sellingPrice,
        p4.arrivalDate as any
      );
      await dao.registerProducts(
        p5.model,
        p5.category,
        p5.quantity,
        p5.details,
        p5.sellingPrice,
        p5.arrivalDate as any
      );
      await dao.registerProducts(
        p6.model,
        p6.category,
        p6.quantity,
        p6.details,
        p6.sellingPrice,
        p6.arrivalDate as any
      );

      await expect(
        dao.getAvailableProducts("model", null, "invalidModel")
      ).rejects.toThrow(ProductNotFoundError);
    });
  });
  /* ************************************************* *
   * Integration test for the deleteAllProducts method *
   * ************************************************* */
  describe("tests for the deleteAllProducts method", () => {
    test("deleteAllProducts should delete all products from the database", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await dao.deleteAllProducts();

      const products = await dao.getProducts(null, null, null);
      expect(products).toEqual([]);
    });

    test("deleteAllProducts should delete all products from the database even if there are no products", async () => {
      await dao.deleteAllProducts();

      const products = await dao.getProducts(null, null, null);
      expect(products).toEqual([]);
    });
  });

  /* ********************************************* *
   * Integration test for the deleteProduct method *
   * ********************************************* */
  describe("tests for the deleteProduct method", () => {
    test("deleteProduct should delete a product from the database", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );
      await dao.registerProducts(
        p2.model,
        p2.category,
        p2.quantity,
        p2.details,
        p2.sellingPrice,
        p2.arrivalDate as any
      );
      await dao.registerProducts(
        p3.model,
        p3.category,
        p3.quantity,
        p3.details,
        p3.sellingPrice,
        p3.arrivalDate as any
      );

      await dao.deleteProduct(p2.model);

      const products = await dao.getProducts(null, null, null);
      expect(products).toEqual([p1, p3]);
    });

    test("deleteProduct should throw an error if the product does not exist", async () => {
      await dao.registerProducts(
        p1.model,
        p1.category,
        p1.quantity,
        p1.details,
        p1.sellingPrice,
        p1.arrivalDate as any
      );

      await expect(dao.deleteProduct("model2")).rejects.toThrow(
        ProductNotFoundError
      );
    });

    test("deleteProduct should throw an error if the model is not provided", async () => {
      await expect(dao.deleteProduct(undefined as any)).rejects.toThrow(
        ProductNotFoundError
      );
    });
  });
});
