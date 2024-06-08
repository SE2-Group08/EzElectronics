import { describe, test, expect, beforeAll, afterAll, jest, beforeEach, afterEach } from "@jest/globals"
import UserDAO from "../../src/dao/userDAO"
import { Role, User } from "../../src/components/user";
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import {
    InvalidParametersError,
    UserAlreadyExistsError,
    UserIsAdminError,
    UserNotFoundError,
    UserNotManagerError,
    UserNotCustomerError,
    UserNotAdminError,
    UnauthorizedUserError,
    InvalidRoleError
} from '../../src/errors/userError';

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

describe('UserDAO', () => {
    let userDAO: UserDAO;

    beforeEach(() => {
        userDAO = new UserDAO();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    //Example of unit test for the createUser method
    //It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
    //It then calls the createUser method and expects it to resolve true

    test("It should resolve true", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        const result = await userDAO.createUser("username", "name", "surname", "password", "role")
        expect(result).toBe(true)
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()
    })

    /* ****************************************************  *
     *    Unit test for the getIsUserAuthenticated method    *
     * ****************************************************  */
    test('The getIsUserAuthenticated method should return true if user is authenticated', async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });

        await expect(userDAO.getIsUserAuthenticated("username", "password"));
    });

    /* ********************************************** *
     *    Unit test for the createUser method  *
     * ********************************************** */
    test("The createUser method should resolve true if a user has been created", async () => {
        jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return Buffer.from("salt");
        });
    });

    test('The createUser method should throw UserAlreadyExistsError if user already exists', async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: users.username")) // Mocks the case where the user already exists
            return {} as Database
        });

        await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(UserAlreadyExistsError);
    });

    /* ********************************************** *
     *    Unit test for the getUserByUsername method  *
     * ********************************************** */
    const customer = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
    const manager = new User("username", "name", "surname", Role.MANAGER, "address", "birthdate");
    const admin = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    test('The getUserByUsername method should return a user by username', async () => {
        const username = 'username';
        const row = {
            username,
            name: 'name',
            surname: 'surname',
            role: 'Customer',
            address: 'address',
            birthdate: 'birthdate'
        };
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, row);
            return {} as Database;
        });

        const result = await userDAO.getUserByUsername(username);
        expect(result).toEqual(customer || manager || admin);
    });

    test('The getUserByUsername method should throw UserNotFoundError if user is not found', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(UserNotFoundError);
    });

    test('The getUserByUsername method should throw InvalidParametersError for empty username', async () => {
        const emptyUsername = '';

        await expect(userDAO.getUserByUsername(emptyUsername)).rejects.toThrow(InvalidParametersError);
    });

    /* ********************************************** *
     *    Unit test for the getUsersByRole method     *
     * ********************************************** */
    test('The getUsersByRole method should throw UserNotFoundError if user is not found', async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        await expect(userDAO.getUsersByRole("role")).rejects.toThrow(UserNotFoundError);
    });

    test('The getUsersByRole method should return users by role', async () => {
        const rows = [
            { username: "user1", name: "name1", surname: "surname1", role: "Customer", address: "address1", birthdate: "birthdate1" },
            { username: "user2", name: "name2", surname: "surname2", role: "Customer", address: "address2", birthdate: "birthdate2" }
        ];
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, rows);
            return {} as any;
        });

        const result = await userDAO.getUsersByRole("Customer");
        expect(result).toEqual(rows.map(row => new User(row.username, row.name, row.surname, row.role as Role, row.address, row.birthdate)));
    });

    test('The getUsersByRole method should throw InvalidRoleError if role is invalid', async () => {
        const invalidRole = "InvalidRole";

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });

        await expect(userDAO.getUsersByRole(invalidRole)).rejects.toThrow(UserNotFoundError);
    });
    /* **************************************** *
    *  Unit test for the deleteUser method      *
    * ***************************************** */
    test('The deleteUser method should delete a user successfully', async () => {
        const username = 'existinguser';
        // Simulate the user exists in the database
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { N: 1 }); // Simulate user found
            return {} as Database;
        });

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(userDAO.deleteUser(username)).resolves.toBe(true);
    });

    test('The deleteUser method should throw UserNotFoundError if user is not found', async () => {
        const username = 'nonexistentuser';

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null); // Simulate no user found
            return {} as Database;
        });

        await expect(userDAO.deleteUser(username)).rejects.toThrow(UserNotFoundError);
    });

    /* *********************************************
    *  Unit test for the deleteUserAsAdmin method  *
    * **********************************************/
    test("The deleteUserAsAdmin method should delete a user as admin successfully", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: "Customer" });
            return {} as Database;
        });
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(userDAO.deleteUserAsAdmin("admin", "username")).resolves.toBe(true);
    });

    test("The deleteUserAsAdmin method should throw UserIsAdminError if user is an admin", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: "Admin" });
            return {} as Database;
        });

        await expect(userDAO.deleteUserAsAdmin("admin", "username")).rejects.toThrow(UserIsAdminError);
    });

    /* **************************************** *
    *  Unit test for the deleteAllUsers method      *
    * ***************************************** */
    test('The deleteAllUsers method should delete all users successfully', async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(userDAO.deleteAllUsers()).resolves.toBe(true);
    });

    test('The deleteAllUsers method should throw UserNotFoundError if no users are found', async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new UserNotFoundError);
            return {} as Database;
        });

        await expect(userDAO.deleteAllUsers()).rejects.toThrow(UserNotFoundError);
    });

    /* **************************************** *
    * Unit test for the UpdateUser method       *
    * ***************************************** */
    test("The updateUser method should update a user successfully", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { role: "Customer" });
            return {} as Database;
        });

        await expect(userDAO.updateUser("username", "name", "surname", "address", "birthdate")).resolves.toEqual(new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate"));
    });

    test("The updateUser method should throw UserNotFoundError if user is not found", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(userDAO.updateUser("nonexistentuser", "name", "surname", "address", "birthdate")).rejects.toThrow(UserNotFoundError);
    });

})
