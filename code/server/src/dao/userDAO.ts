import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { InvalidParametersError, UnauthorizedUserError, InvalidRoleError, UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from "../errors/userError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                /**
                 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
                 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
                 */
                const sql = "SELECT username, password, salt FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                        resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                        resolve(true)
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) 
                            reject(new UserAlreadyExistsError)
                        reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }


    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string) {
        return new Promise<User>((resolve, reject) => {
            if (!username || username.trim().length == 0) {
                reject(new InvalidParametersError);
            }
            else {
                try {
                    const sql = "SELECT * FROM users WHERE username=?"
                    db.get(sql, [username], (err: Error | null, row: any) => {
                        if (err) {
                            return reject(err);
                        }
                        else if (!row) {
                            return reject(new UserNotFoundError);
                        }
                        else {
                            const user = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate);
                            resolve(user);
                        }
                        return;
                    })
                }
                catch (error) {
                    reject(error);
                    return;
                }
            }
        })
    }

    getUsers() {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users";
                db.all(sql, [], (err: Error | null, rows: any) => {
                    if (err) {
                        return reject(err);
                    }

                    let Users = rows.map((row: any) => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                    return resolve(Users);
                })
            }
            catch (error) {
                return reject(error);
            }
        })
    }

    getUsersByRole(role: string) {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE role=?";
                db.all(sql, [role], (err: Error | null, rows: any) => {
                    if (err) {
                        return reject(err);
                    }

                    if (rows.length === 0) {
                        return reject(new UserNotFoundError);
                    }

                    let Users = rows.map((row: any) => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                    resolve(Users);
                })
            }
            catch (error) {
                return reject(error);
            }
        })
    }

    deleteUser(requested: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                let firstsql = "SELECT * FROM users WHERE username=?";
                db.get(firstsql, [requested], (err: Error | null, answer: any) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (!answer) {
                        return reject(new UserNotFoundError);
                    }
                })
                const sql = "DELETE FROM users WHERE username=?";
                db.run(sql, [requested], function (err: Error | null) {
                    if (err) {
                        return reject(err);
                    }
                    else {
                        return resolve(true);
                    }
                })
            }
            catch (error) {
                return reject(error);
            }
        })
    }

    deleteUserAsAdmin(user: string, username: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                let sql = "SELECT role FROM users WHERE username=?";
                db.get(sql, [username], (err: string | null, role: any) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (!role) {
                        return reject(new UserNotFoundError);
                    }
                    else if (role.role == "Admin") {
                        return reject(new UserIsAdminError);
                    }
                    else {
                        sql = "DELETE FROM users WHERE username=?";
                        db.run(sql, [username], function (err: Error | null) {
                            if (err) {
                                return reject(err);
                            }
                            else {
                                resolve(true);
                            }
                        })
                    }
                    return;
                })
            }
            catch (error) {
                return reject(error);
            }
        })
    }

    deleteAllUsers() {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM users WHERE role!='Admin'";
                db.run(sql, [], function (err: Error | null) {
                    if (err) {
                        return reject(err);
                    }
                    else {
                        resolve(true);
                    }
                    return;
                })
            }
            catch (error) {
                reject(error);
                return;
            }
        })
    }

    updateUser(username: string, name: string, surname: string, address: string, birthdate: string) {
        return new Promise<User>((resolve, reject) => {
            try {
                let firstsql = "SELECT * FROM users WHERE username=?";
                db.get(firstsql, [username], (err: Error | null, answer: any) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (!answer) {
                        return reject(new UserNotFoundError);
                    }
                })

                let sql = "UPDATE users SET name=?, surname=?, address=?, birthdate=? WHERE username=?"
                db.run(sql, [name, surname, address, birthdate, username], function (err: Error | null) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        sql = "SELECT role FROM users WHERE username=?";
                        db.get(sql, [username], (err: string | null, role: any) => {
                            if (err) {
                                return reject(err);
                            }
                            else if (!role) {
                                return reject(new UserNotFoundError);
                            }
                            else {
                                resolve(new User(username, name, surname, role.role, address, birthdate));
                            }
                        })
                        return;
                    }
                })
            }
            catch (error) {
                return reject(error);
            }
        })
    }

    updateUserAsAdmin(username: string, name: string, surname: string, address: string, birthdate: string) {
        return new Promise<User>((resolve, reject) => {
            try {
                let sql = "SELECT role FROM users WHERE username=?"
                db.get(sql, [username], (err: string | null, role: any) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (!role) {
                        return reject(new UserNotFoundError);
                    }
                    else if (role.role == "Admin") {
                        return reject(new UserIsAdminError);
                    }
                    else {
                        sql = "UPDATE users SET name=?, surname=?, address=?, birthdate=? WHERE username=?"
                        db.run(sql, [name, surname, address, birthdate, username], function (err: Error | null) {
                            if (err) {
                                return reject(err);
                            }
                            else {
                                resolve(new User(username, name, surname, role.role, address, birthdate));
                            }
                            return;
                        })
                    }
                })
            }
            catch (error) {
                return reject(error);
            }
        })
    }
}
export default UserDAO