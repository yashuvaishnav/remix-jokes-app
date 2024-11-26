
import { MetaFunction } from "@remix-run/node";
import { ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { createUserSession, login, register } from "~/utils/session.server";

export const meta: MetaFunction = () => {
    const description =
        "Login to submit your own jokes to Remix Jokes!";

    return [
        { name: "description", content: description },
        { name: "twitter:description", content: description },
        { title: "Remix Jokes | Login" },
    ];
}

function validateUsername(username: string) {
    if (username.length < 3) {
        return "Usernames must be at least 3 characters long";
    }
}

function validatePassword(password: string) {
    if (password.length < 6) {
        return "Passwords must be at least 6 characters long";
    }
}
function validateUrl(url: string) {
    const urls = ["/jokes", "/", "https://remix.run"];
    if (urls.includes(url)) {
        return url;
    }
    return "/jokes";
}

export const action = async ({
    request,
}: ActionFunctionArgs) => {
    const form = await request.formData();
    const loginType = form.get("loginType");
    const password = form.get("password");
    const username = form.get("username");
    const redirectTo = validateUrl(
        (form.get("redirectTo") as string) || "/jokes"
    );
    if (
        typeof loginType !== "string" ||
        typeof password !== "string" ||
        typeof username !== "string"
    ) {
        return badRequest({
            fieldErrors: null,
            fields: null,
            formError: "Form not submitted correctly.",
        });
    }

    const fields = { loginType, password, username };
    const fieldErrors = {
        password: validatePassword(password),
        username: validateUsername(username),
    };
    if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({
            fieldErrors,
            fields,
            formError: null,
        });
    }

    switch (loginType) {
        case "login": {
            // login to get the user
            // if there's no user, return the fields and a formError
            // if there is a user, create their session and redirect to /jokes
            const user = await login({ username, password });
            if (!user) {
                return badRequest({
                    fieldErrors: null,
                    fields,
                    formError:
                        "Username/Password combination is incorrect",
                });
            }
            return createUserSession(user.id, redirectTo);

        }
        case "register": {
            const userExists = await db.user.findFirst({
                where: { username },
            });
            if (userExists) {
                return badRequest({
                    fieldErrors: null,
                    fields,
                    formError: `User with username ${username} already exists`,
                });
            }
            const user = await register({ username, password });
            if (!user) {
                return badRequest({
                    fieldErrors: null,
                    fields,
                    formError:
                        "Something went wrong trying to create a new user.",
                });
            }
            return createUserSession(user.id, redirectTo);
        }
        default: {
            return badRequest({
                fieldErrors: null,
                fields,
                formError: "Login type invalid",
            });
        }
    }
};
const Login = () => {
    const actionData = useActionData<typeof action>();
    const [searchParams] = useSearchParams();
    return (

        <div className="flex flex-col items-center justify-center">
            <div className=" mb-[20px] flex justify-around  border-2 bg-blue-800 w-[100%] py-[15px]">
                <Link to="/" className="text-[20px] font-bold py-[5px] flex items-center justify-center border-2 px-[20px] rounded-md text-center text-lg  text-white border-2 rounded-md shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out focus:outline-none">Home</Link>
                <Link to="/jokes" className="text-[20px] font-bold py-[5px] flex items-center justify-center border-2 px-[20px] rounded-md text-center text-lg  text-white border-2 rounded-md shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out focus:outline-none">Jokes</Link>

            </div>
            <div className="p-6 rounded-xl w-[30%] bg-gray-100  border-gray-2 ">
                <h1 className="text-center font-bold text-[32px] p-[10px] text-blue-500">Login</h1>
                <Form method="post" className="w-[90%] m-auto">
                    <input
                        type="hidden"
                        name="redirectTo"
                        value={searchParams.get("redirectTo") ?? ""}
                    />
                    <fieldset className="my-[10px]  px-[20px]">
                        <legend className="sr-only">
                            Login or Register?
                        </legend>
                        <div className="flex justify-between">
                            <label className="text-[18px] font-bold">
                                <input type="radio" name="loginType" value="login" className="pr-[5px]" defaultChecked={
                                    !actionData?.fields?.loginType ||
                                    actionData?.fields?.loginType === "login"
                                } /> Login
                            </label>
                            <label className="text-[18px] font-bold">
                                <input type="radio" name="loginType" value="register" className="font-[25px]" defaultChecked={
                                    actionData?.fields?.loginType ===
                                    "register"
                                } /> Register
                            </label>
                        </div>
                    </fieldset>
                    <div className="flex flex-col ">
                        <label className="text-[22px] font-bold my-[10px] ">Username</label>
                        <input type="text" id="username-input" name="username" placeholder="User Name" className="p-[8px] hover:outline-blue-500 pl-[10px] outline-none rounded-md" defaultValue={actionData?.fields?.username}
                            aria-invalid={Boolean(
                                actionData?.fieldErrors?.username
                            )}
                            aria-errormessage={
                                actionData?.fieldErrors?.username
                                    ? "username-error"
                                    : undefined
                            } />{actionData?.fieldErrors?.username ? (
                                <p
                                    className="form-validation-error text-red-500 "
                                    role="alert"
                                    id="username-error"
                                >
                                    {actionData.fieldErrors.username}
                                </p>
                            ) : null}
                    </div>
                    <div className="flex flex-col ">
                        <label className="text-[22spx] font-bold my-[10px] ">Password</label>
                        <input id="password-input" name="password" placeholder="Password" type="password" className="p-[8px] pl-[10px] hover:outline-blue-500 outline-none rounded-md" defaultValue={actionData?.fields?.password}
                            aria-invalid={Boolean(
                                actionData?.fieldErrors?.password
                            )}
                            aria-errormessage={
                                actionData?.fieldErrors?.password
                                    ? "password-error"
                                    : undefined
                            } />{actionData?.fieldErrors?.password ? (
                                <p
                                    className="form-validation-error text-red-500 "
                                    role="alert"
                                    id="password-error"
                                >
                                    {actionData.fieldErrors.password}
                                </p>
                            ) : null}
                    </div>
                    <div className="flex mt-[15px] ">
                        <div id="form-error-message">
                            {actionData?.formError ? (
                                <p
                                    className="form-validation-error"
                                    role="alert"
                                >
                                    {actionData.formError}
                                </p>
                            ) : null}
                        </div>
                        <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 mt-[10px]">Submit</button>
                    </div>
                </Form>
            </div>
        </div>


    );
}


export default Login;
