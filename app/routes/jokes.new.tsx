import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, isRouteErrorResponse, useRouteError, Link } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId, getUserId } from "~/utils/session.server";

export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json({});
};

function validateJokeContent(content: string) {
  if (content.length < 20) {
    return "That joke is too short";
  }
}

function validateJokeName(name: string) {
  if (name.length < 5) {
    return "That joke's name is too short";
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const name = form.get("name");
  const content = form.get("content");
  const userId = await requireUserId(request);

  if (typeof content !== "string" || typeof name !== "string") {
    return badRequest({
      fieldErrors: null,
      fields: null,
    });
  }

  const fieldErrors = {
    content: validateJokeContent(content),
    name: validateJokeName(name),
  };

  const fields = { content, name };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
    });
  }

  const joke = await db.joke.create({ data: { ...fields, jokesterId: userId }, });

  return redirect(`/jokes/${joke.id}`);
};
const AddJokes = () => {
  const actionData = useActionData<typeof action>();
  return (
    <div>
      <h1 className="text-[32px] text-gray-400 font-bold">Add Jokes</h1>
      <Form method="post">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Name:
              <input
                defaultValue={actionData?.fields?.name}
                type="text"
                name="name"
                aria-invalid={Boolean(actionData?.fieldErrors?.name)}
                aria-errormessage={
                  actionData?.fieldErrors?.name ? "name-error" : undefined
                }
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </label>
            {actionData?.fieldErrors?.name ? (
              <p className="form-validation-error text-red-500" id="name-error" role="alert">
                {actionData.fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Content:
              <textarea
                defaultValue={actionData?.fields?.content}
                name="content"
                aria-invalid={Boolean(actionData?.fieldErrors?.content)}
                aria-errormessage={
                  actionData?.fieldErrors?.content ? "content-error" : undefined
                }
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </label>
            {actionData?.fieldErrors?.content ? (
              <p
                className="form-validation-error text-red-500"
                id="content-error"
                role="alert"
              >
                {actionData.fieldErrors.content}
              </p>
            ) : null}
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
};
export default AddJokes;


export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error);
  if (isRouteErrorResponse(error) && error.status === 401) {
    return (
      <div className="error-container p-4 rounded-md shadow-lg border-t-2">
        <p className="mb-[20px]">You must be logged in to create a joke.</p>
        <Link
          to="/login"
          className="text-blue-500 font-semibold border-2 border-blue-500 py-[7px] px-[15px] rounded-md mt-[20px] hover:text-blue-700 hover:border-blue-700"
        >
          Login
        </Link>
      </div>

    );
  }

  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}