import ProductDAO from "../dao/productDAO";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ArrivalDateError, FiltersError, InvalidParametersError } from "../errors/productError";

dayjs.extend(customParseFormat);

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null | undefined, sellingPrice: number, arrivalDate: string | null | undefined) /**:Promise<void> */ { 
        if (
            (typeof model !== 'string' || model.trim() === '') || 
            (typeof category !== 'string' || (!["Smartphone", "Laptop", "Appliance"].includes(category))) || 
            (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) || 
            (details && (typeof details !== 'string' || details.trim() === '')) || 
            (typeof sellingPrice !== 'number' || sellingPrice <= 0.00) ||
            (arrivalDate  && (typeof arrivalDate !== 'string' || !dayjs(arrivalDate, 'YYYY-MM-DD', true).isValid()))
        ) {
            throw new InvalidParametersError
        }

        if (arrivalDate && arrivalDate > dayjs().format('YYYY-MM-DD')) {
            throw new ArrivalDateError
        }

        const ret: any = await this.dao.registerProducts(model.trim(), category.trim(), quantity, details ? details.trim() : `BUY YOUR ${model} NOW!`, sellingPrice, arrivalDate? arrivalDate : dayjs().format('YYYY-MM-DD'));
        return ret;
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null | undefined) /**:Promise<number> */ {
        if (
            (typeof model !== 'string' || model.trim() === '') || 
            (typeof newQuantity !== 'number' || !Number.isInteger(newQuantity) || newQuantity <= 0) || 
            (changeDate && (typeof changeDate !== 'string' || !dayjs(changeDate, 'YYYY-MM-DD', true).isValid()))
        ) {
            throw new InvalidParametersError
        }

        if (changeDate && changeDate > dayjs().format('YYYY-MM-DD')) {
            throw new ArrivalDateError
        }

        const ret: any = await this.dao.changeProductQuantity(model, newQuantity, changeDate);
        return ret;
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null | undefined) /**:Promise<number> */ {
        if (
            (typeof model !== 'string' || model.trim() === '') || 
            (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) || 
            (sellingDate && (typeof sellingDate !== 'string' || !dayjs(sellingDate, 'YYYY-MM-DD', true).isValid()))
        ) {
            throw new InvalidParametersError
        }

        if (sellingDate !== null && sellingDate > dayjs().format('YYYY-MM-DD')) {
            throw new ArrivalDateError
        }

        const ret: any = await this.dao.sellProduct(model, quantity, sellingDate);
        return ret;
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) /**Promise<Product[]> */ {
        let ret: any;

        if (
            (!grouping && !category && !model) ||
            (grouping === "category" && ["Smartphone", "Laptop", "Appliance"].includes(category) && !model) ||
            (grouping === "model" && !category && model)
        ) {
            ret = await this.dao.getProducts(grouping, category, model);
        } else {
            throw new FiltersError();
        }
        
        return ret;
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) /**:Promise<Product[]> */ {
        let ret: any

        if (
            (!grouping && !category && !model) ||
            (grouping === "category" && ["Smartphone", "Laptop", "Appliance"].includes(category) && !model) ||
            (grouping === "model" && !category && model)
        ) {
            ret = await this.dao.getAvailableProducts(grouping, category, model);
        } else {
            throw new FiltersError();
        }
        
        return ret;
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts() /**:Promise <Boolean> */ {
        const ret: any = await this.dao.deleteAllProducts();
        
        return ret;
    }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string) /**:Promise <Boolean> */ {
        if (typeof model !== 'string' || model.trim() === '') {
            throw new InvalidParametersError
        }
        const ret: any = await this.dao.deleteProduct(model);

        return ret;
    }

}

export default ProductController;