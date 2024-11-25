
import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { json, Link, useLoaderData, useParams, isRouteErrorResponse, useRouteError, Form } from "@remix-run/react";
import { useState } from "react";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";
import { JokeDisplay } from "~/components/joke";

export const meta: MetaFunction<typeof loader> = ({
  data,
}) => {
  const { description, title } = data
    ? {
      description: `Enjoy the "${data.joke.name}" joke and much more`,
      title: `"${data.joke.name}" joke`,
    }
    : { description: "No joke found", title: "No joke" };

  return [
    { name: "description", content: description },
    { name: "twitter:description", content: description },
    { title },
  ];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  const res =
    await db.joke.findUnique({
      where: { id: params.jokeId },
    });
  if (!res) {
    throw new Response("What a joke! Not found.", {
      status: 404,
    });
  }
  return json({ joke: res, isOwner: userId === res.jokesterId, });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const form = await request.formData();
  console.log("form data::", form)

  const name = form.get('name') as string;
  const content = form.get('content') as string;
  const action = form.get('action');
  switch (action) {
    case 'update_todo':
      return await db.joke.update({
        where: { id: params.jokeId },
        data: {
          name: name?.toLowerCase(),
          content: content?.toLowerCase(),
        },
      });
  }



  if (form.get("intent") !== "delete") {
    throw new Response(
      `The Intent ${form.get("intent")} is not supported`,
      { status: 400 }
    )
  }
  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    });
  }
  if (joke.jokesterId !== userId) {
    throw new Response(
      "Pssh, nice try. That's not your joke",
      { status: 403 }
    );
  }
  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect("/jokes");
}


const SingleJoke = () => {
  const { joke, isOwner } = useLoaderData<typeof loader>();
  const [edit, setEdit] = useState(false);
  return (
    <div>
      <h2 className="text-[32px] font-bold ">Single Blog</h2>
      <div className="p-4 border rounded-lg shadow-md bg-white mt-[20px]">
        {joke ? (
          <>
            <Link to={"."}>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Name: {joke.name}
              </h1>
            </Link>
            <p className="text-gray-700">{joke.content}</p>
          </>
        ) : (
          <p className="text-gray-500 italic">Loading...</p>
        )}
        {isOwner ? (
          <>
            <Form method="post">
              <button
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                name="intent"
                type="submit"
                value="delete"
              >
                Delete
              </button>
            </Form>
            {edit && (
              <Form method="POST">
                <input type="hidden" name="action" value="update_todo" />
                <input type="text" name="name" defaultValue={joke ? joke.name : ''} />
                <input type="text" name="content" defaultValue={joke ? joke.content : ''} />
                <br /><br />
                <button type="submit">submit</button>
                <span onClick={() => setEdit(false)}>              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                </span>
              </Form>
            )}
            <button type="submit" onClick={() => setEdit(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>

            </button>

          </>
        ) : null}
      </div>
    </div>
  );
};
export default SingleJoke;

export function ErrorBoundary() {
  const { jokeId } = useParams();
  const error = useRouteError();
  console.log(error);

  if (isRouteErrorResponse(error)) {
    if (error.status === 400) {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }
    if (error.status === 403) {
      return (
        <div className="error-container">
          Sorry, but "{jokeId}" is not your joke.
        </div>
      );
    }
    if (error.status === 404) {
      return (
        <div className="error-container">
          Huh? What the heck is "{jokeId}"?
        </div>
      );
    }
  }

  return (
    <div className="error-container">
      There was an error loading joke by the id "${jokeId}".
      Sorry.
    </div>
  );
}