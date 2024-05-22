import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";

class ReviewController {
    private dao: ReviewDAO

    constructor() {
        this.dao = new ReviewDAO
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string) /**:Promise<void> */ {
        if (!model || !user || score < 1 || score > 5 || !comment || !comment.trim()) {
            throw new Error("Invalid parameters");
        } else {
            return this.dao.addReview(model, user, score, comment);
        }
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) /**:Promise<ProductReview[]> */ {
        if (!model || !model.trim()) {
            throw new Error("Invalid parameters");
        } else {
            return this.dao.getProductReviews(model);
        }
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User) /**:Promise<void> */ {
        if (!model || !model.trim() || !user) {
            throw new Error("Invalid parameters");
        } else {
            return this.dao.deleteReview(model, user);
        }
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string) /**:Promise<void> */ {
        if (!model || !model.trim()) {
            throw new Error("Invalid parameters");
        } else {
            return this.dao.deleteReviewsOfProduct(model);
        }
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews() /**:Promise<void> */ {
        return this.dao.deleteAllReviews();
    }
}

export default ReviewController;