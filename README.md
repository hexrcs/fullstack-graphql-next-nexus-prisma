# Complete Introduction to Fullstack, Type-Safe GraphQL (feat. Next.js, Nexus, Prisma)

In this post, you'll learn how to build from scratch an entirely type-safe, fullstack web app, using GraphQL with a database attached!

All the changes are committed by the end of each step, so if you are trying to follow along, clone [this repo](https://github.com/hexrcs/fullstack-graphql-next-nexus-prisma) and check [the commits](https://github.com/hexrcs/fullstack-graphql-next-nexus-prisma/commits/master)! 😃

> 🗓 Update 22/06/2020: _All dependencies upgraded to the latest major versions! (`nexus@0.24.2`, `next-urql@1.0.1`)_

## Our tech stack

First, let's have a look at our tools of choice:

- [**TypeScript**](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) - the programming language for both backend and frontend
- [**React**](https://reactjs.org/) and [**Next.js**](https://nextjs.org/) - as the frontend framework and [_middle-end_](https://medium.com/the-ideal-system/next-js-is-not-what-you-may-think-it-is-8423172e7401)
- [**Urql GraphQL client**](https://formidable.com/open-source/urql/) - the GraphQL client on the frontend
- [**PostgreSQL**](https://www.postgresql.org/) - the database for the app
- [**Nexus**](https://nexusjs.org/) - a [_code-first_](https://www.nexusjs.org/#/?id=why) backend GraphQL framework
- [**Prisma Client**](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client) and [**Prisma Migrate**](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-migrate) - a toolkit to change the database schema, access, and query the database _(Note: Prisma Migrate is still experimental at the moment)_

Let's get started! 🚀

## Step 0: Install VS Code extensions

Before we start, make sure that you have installed these VS Code extensions for syntax highlighting and auto-formatting - [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma) and [GraphQL](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql).

![Prisma Extension for VS Code](https://i.imgur.com/wlX71dw.png)<figcaption>Prisma Extension for VS Code</figcaption>

![GraphQL Extension for VS Code](https://i.imgur.com/NlcGhhq.png)<figcaption>GraphQL Extension for VS Code</figcaption>

## Step 1: Spin up a PostgreSQL database

The first thing you'll need is a PostgreSQL database instance to interact with during development.

There are many options for this, but Heroku allows us to host PostgreSQL databases for free with minimal setup required. Check out [this post](https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1) by [Nikolas Burk](https://dev.to/nikolasburk) guiding you through the process!

If you have Docker installed and would rather keep your development database local, you can also check out [this video](https://egghead.io/lessons/postgresql-set-up-and-run-a-postgresql-instance-locally-with-docker-compose?pl=build-a-full-stack-app-with-prisma-2-7c81) I did on how to do this with Docker Compose.

You will be able to get a PostgreSQL URI in this format:

```
postgresql://<USER>:<PASSWORD>@<HOST_NAME>:<PORT>/<DB_NAME>
```

> Note: if you are using Heroku, you'll get a URI with `postgres` instead of `postgresql` as the protocol. Both formats should work but we'd prefer to use `postgresql`.

When everything is set up properly, you're good to move on to the next step! 😃

## Step 2: Create a Next.js project

Now, create a Next.js project with `create-next-app` and enter the directory:

```bash
npx create-next-app my-awesome-app --use-npm -e with-typescript
cd my-awesome-app
```

Git should be automatically initialized by `create-next-app`, and your project structure should look like this:

![Project structure bootstrapped by `create-next-app`](https://i.imgur.com/kzVMkAY.png)<figcaption>Project structure bootstrapped by <code>create-next-app</code></figcaption>

> The `create-next-app` might not have the latest TypeScript package pre-installed. If you want to use the latest TypeScript features, run `npm install -D typescript@latest` after the project is bootstrapped.

## Step 3: Install Nexus with Prisma

With the Next.js project ready, create a `.env` file in a new directory `/prisma/` in your project root, and create an environment variable `DATABASE_URL` with the PostgreSQL URI from _Step 1_. Mine looks like this:

```
DATABASE_URL="postgresql://alice:wonderland@localhost:5432/mydb"
```

Because the URL contains sensitive information, it's a good practice to **never** commit this `.env` file with Git, so make sure it's also added to the `.gitignore` file.

Now, create a starter schema file for Prisma at `/prisma/schema.prisma` like below:

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id   String @default(cuid()) @id
  name String
}
```

The schema file tells Prisma to use PostgreSQL as the database type, and the database connection URL is defined as an environment variable. It also defines a simple `User` data model with an `id` and a `name` field.

Your project should currently look like this:

![Project structure after creating the `prisma` directory](https://i.imgur.com/riZnypE.png)<figcaption>Project structure after creating the <code>prisma</code> directory</figcaption>

Then, install the Nexus framework and the `nexus-plugin-prisma` package:

```bash
npm install nexus nexus-plugin-prisma
```

The plugin already bundles Prisma, so you don't need to install `@prisma/client` or `@prism/cli` separately.

To improve the development experience, also add the [Nexus TypeScript Language Service plugin](https://www.nexusjs.org/#/guides/project-layout?id=typescript-language-service-plugin), and tweak a few compiler options in the `tsconfig.json` file like below:

```json
{
  "compilerOptions": {
    // ...
    "noEmit": true,
    "rootDir": ".",
    "typeRoots": ["node_modules/@types", "types"],
    "plugins": [{ "name": "nexus/typescript-language-service" }]
  },
  // ...
  "include": ["**/*.ts", "**/*.tsx", ".", "types.d.ts"]
}
```

## Step 4: Wire up Nexus with Next.js

To create a GraphQL endpoint, create a new file in your project at `/pages/api/graphql.ts`. Thanks to the powerful [API routes](https://nextjs.org/docs/api-routes/introduction) in Next.js, the GraphQL server will be accessible at [`http://our-app-domain/api/graphql`](http://our-app/api/graphql) when the Next.js server is started.

In the `/pages/api/graphql.ts` file, write the following boilerplate code:

```tsx
import app, { server } from "nexus";
import "../../graphql/schema"; // we'll create this file in a second!

app.assemble();

export default server.handlers.graphql;
```

Since everything inside the `/pages/api/` directory is considered as an API route, it's a good idea to implement the actual schema and resolvers outside this directory.

Now, create a new directory in the project root called `/graphql/` and a file `/graphql/schema.ts` in it for the actual GraphQL logic.

Inside `/graphql/schema.ts`, start by initializing the Prisma plugin, with the _CRUD_ feature enabled, which we'll be using later:

```tsx
import { schema, use } from "nexus";
import { prisma } from "nexus-plugin-prisma";

use(prisma({ features: { crud: true } }));
```

Your project should now look like below. Notice that the _about_ and _user_ pages are examples created by `create-next-app`, and not related to our project. You can remove them if you like, but I'll leave them here to make it feel more like a "real-world project". 🙂

![Project structure after creating `/graphql/schema.ts` and `/pages/api/graphql.ts`](https://i.imgur.com/Cf5lm12.png)<figcaption>Project structure after creating <code>/graphql/schema.ts</code> and <code>/pages/api/graphql.ts</code></figcaption>

Now you can start the Nexus dev server from the project root:

```tsx
npx nexus dev
```

![Running Nexus dev server](https://i.imgur.com/OyKTlM2.png)<figcaption>Running Nexus dev server</figcaption>

If you go to [http://localhost:4000](http://localhost:4000), you'll see the GraphQL Playground up and running (with an empty schema)! 😃

![GraphQL Playground with an empty schema](https://i.imgur.com/3ZdZqMK.png)<figcaption>GraphQL Playground with an empty schema</figcaption>

## Step 5: Implement your first GraphQL API

With the Nexus dev server running in the background and the GraphQL Playground ready at [http://localhost:4000](http://localhost:4000), it's time to start implementing the API!

### Step 5.1: Define an Object type

The `schema` object allows defining GraphQL schema entirely with TypeScript.

First, start by defining a `User` object type to reflect the database schema:

```tsx
schema.objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.name();
  },
});
```

If you are typing the code above instead of copy n' pasting, you will notice that VS Code will autocomplete the fields (`id`, `name`) that are available on the `User` data model defined earlier in `/prisma/schema.prisma`.

> Tip: You can also always invoke intellisense with <kbd>CTRL + SPACE</kbd>, in case it doesn't automatically show up sometimes, super helpful!

Now, go back to the GraphQL Playground and toggle the _Schema_ side panel - you will see a GraphQL object type `User` is generated from the code you just wrote in the `/graphql/schema.ts` file.

```graphql
type User {
  id: String!
  name: String!
}
```

![A `User` object type is generated by Nexus](https://i.imgur.com/e7S6zFJ.png)<figcaption>A <code>User</code> object type is generated by Nexus</figcaption>

### Step 5.2: Define the Query type

For the root `Query` type, Nexus has `schema.queryType`.

To query a list of existing users in the database, you can write a resolver for `allUsers` field as follows:

```tsx
schema.queryType({
  definition(t) {
    t.list.field("allUsers", {
      type: "User",
      resolve(_parent, _args, ctx) {
        return ctx.db.user.findMany();
      },
    });
  },
});
```

You can do whatever you want in the `resolve` function. The Prisma client for your database can be directly accessed as the `db` property on the `ctx` object. You can read more about the API of Prisma Client in its [official documentation](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/crud).

> Tip: You can always use the intellisense feature in VS Code to explore the APIs of Nexus and Prisma Client!

In addition to manually writing resolvers, the Nexus-Prisma plugin conveniently exposes basic "read" operations on the database on `t.crud`. The following code will let you find a `User` (or a list of _`User`s_) from the database directly.

```tsx
schema.queryType({
  definition(t) {
    t.list.field("allUsers", {
      type: "User",
      resolve(_parent, _args, ctx) {
        return ctx.db.user.findMany({});
      },
    });
    t.crud.user();
    t.crud.users();
  },
});
```

The code above will generate a GraphQL root `Query` type:

```graphql
type Query {
  allUsers: [User!]
  user(where: UserWhereUniqueInput!): User
  users(
    skip: Int
    after: UserWhereUniqueInput
    before: UserWhereUniqueInput
    first: Int
    last: Int
  ): [User!]!
}

input UserWhereUniqueInput {
  id: String
}
```

Notice that all the related `Input` types are also generated for us for free! 💯

![`Query` type is generated by Nexus](https://i.imgur.com/EXsOy3B.png)<figcaption><code>Query</code> type is generated by Nexus</figcaption>

### Step 5.3: Define the Mutation type

Similar to the Query type, `Mutation` type can be defined with `schema.mutationType`.

😈 Let's have some fun and create a `bigRedButton` mutation to destroy all user data in the database like below:

```tsx
schema.mutationType({
  definition(t) {
    t.field("bigRedButton", {
      type: "String",
      async resolve(_parent, _args, ctx) {
        const { count } = await ctx.db.user.deleteMany({});
        return `${count} user(s) destroyed. Thanos will be proud.`;
      },
    });
  },
});
```

You also have access to the `t.crud` helper here, which exposes the basic "create", "update" and "delete" operations on the database.

```tsx
schema.mutationType({
  definition(t) {
    t.field("bigRedButton", {
      type: "String",
      async resolve(_parent, _args, ctx) {
        const { count } = await ctx.db.user.deleteMany({});
        return `${count} user(s) destroyed. Thanos will be proud.`;
      },
    });

    t.crud.createOneUser();
    t.crud.deleteOneUser();
    t.crud.deleteManyUser();
    t.crud.updateOneUser();
    t.crud.updateManyUser();
  },
});
```

This will generate a GraphQL schema like below:

```graphql
type Mutation {
  bigRedButton: String
  createOneUser(data: UserCreateInput!): User!
  deleteOneUser(where: UserWhereUniqueInput!): User
  deleteManyUser(where: UserWhereInput): BatchPayload!
  updateOneUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  updateManyUser(
    data: UserUpdateManyMutationInput!
    where: UserWhereInput
  ): BatchPayload!
}
```

![`Mutation` type is generated by Nexus](https://i.imgur.com/7mfLl68.png)<figcaption><code>Mutation</code> type is generated by Nexus</figcaption>

Now, our simple but fully featured GraphQL API is ready! 🥳

## Step 6: Initialize database

Before you can do anything with your GraphQL API, you'll need to create tables in the database corresponding to the Prisma schema file.

This can be done by manually connecting to the database and running SQL commands, but I'll show you how to do it with [Prisma Migrate](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-migrate) - the database migration tool that's part of Prisma 2.

First, save the initial changes of our `schema.prisma` file with the command below. At the moment, Migrate is still in an experimental state, so the extra flag `--experimental` is needed.

```bash
npx prisma migrate save --name init --experimental
```

This will create a `migration` folder inside `/prisma`.

![Schema migrations are created](https://i.imgur.com/EUj5gVJ.png)<figcaption>Schema migrations are created</figcaption>

Now, push the updates to the database with this command:

```bash
npx prisma migrate up --experimental
```

Awesome! With the database prepared, it's time to go back to [http://localhost:4000](http://localhost:4000), and have some fun with the your first GraphQL API with Nexus. Let me give you an example to play with!

```graphql
mutation {
  createOneUser(data: { name: "Alice" }) {
    id
  }
}
```

![Testing out user creation 😎](https://i.imgur.com/160bZim.png)<figcaption>Testing out user creation 😎</figcaption>

## Step 7: Set up Urql GraphQL client with Next.js

We'll use _[Urql](https://formidable.com/open-source/urql/)_ as the GraphQL client on the frontend, but you can use any library you like.

First, install the dependencies:

```bash
	npm install graphql-tag next-urql react-is urql isomorphic-unfetch
```

Then, create a new file at `/pages/_app.tsx`. This is a [special Next.js component](https://nextjs.org/docs/advanced-features/custom-app) that will be used to initialize all pages.

```tsx
import React from "react";
import { withUrqlClient, NextUrqlAppContext } from "next-urql";
import NextApp, { AppProps } from "next/app";
import fetch from "isomorphic-unfetch";

// the URL to /api/graphql
const GRAPHQL_ENDPOINT = `http://localhost:3000/api/graphql`;

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

App.getInitialProps = async (ctx: NextUrqlAppContext) => {
  const appProps = await NextApp.getInitialProps(ctx);
  return { ...appProps };
};

export default withUrqlClient((_ssrExchange, _ctx) => ({
  url: GRAPHQL_ENDPOINT,
  fetch,
}))(
  // @ts-ignore
  App
);
```

And that's it! Now you can use the GraphQL client in any page in your Next.js app.

## Step 8: Use the GraphQL client

First, create a TSX file at `/components/AllUsers.tsx`. This file will have a component that performs an `allUsers` GraphQL query and renders the result as a list. This way, we can use the component to fetch all the user info from our PostgreSQL database.

You can create the query first, for example, with the following code. By using `gql`, the GraphQL VS Code extension will be able to identify the template string as a GraphQL query and apply nice syntax highlighting to it.

```tsx
import React from "react";
import gql from "graphql-tag";
import { useQuery } from "urql";

const AllUsersQuery = gql`
  query {
    allUsers {
      id
      name
    }
  }
`;
```

Since it's known that the data you are going to get is an array of `User` objects (thank you, GraphQL schema!), you can also define a new type:

```tsx
type AllUsersData = {
  allUsers: {
    id: string;
    name: string;
  }[];
};
```

Next, create the React component that will be using the query.

The component encapsulates the following logic:

- If the query is still in a _fetching_ state, the text "Loading..." will be returned
- If an error is occurred during the process, we will display the error
- If the query is no longer _fetching_ and there's no error, the data will be used to render a list of users

```tsx
const AllUsers: React.FC = () => {
  const [result] = useQuery<AllUsersData>({
    query: AllUsersQuery,
  });
  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return (
    <div>
      <p>There are {data?.allUsers.length} user(s) in the database:</p>
      <ul>
        {data?.allUsers.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default AllUsers;
```

Now, save the TSX file, and mount it onto the home page `/pages/index.tsx`:

```tsx
import Link from "next/link";
import Layout from "../components/Layout";
import AllUsers from "../components/AllUsers";

const IndexPage = () => (
  <Layout title="Home | Next.js + TypeScript Example">
    <h1>Hello Next.js 👋</h1>
    <p>
      <Link href="/about">
        <a>About</a>
      </Link>
    </p>
    {/* === Tada! === */}
    <AllUsers />
  </Layout>
);

export default IndexPage;
```

Time to spin up the Next.js dev server!

```bash
npm run dev
```

Voilà! The user list is rendered! 🥳

![User list is rendered on our home page](https://i.imgur.com/l3XM26c.png)<figcaption>A user list is rendered on our home page</figcaption>

## Step 9: Auto-generate `useQuery` hooks and types

Instead of manually defining all the types we expect to receive via GraphQL, we can also use a very cool package _[GraphQL Code Generator](https://graphql-code-generator.com/)_ to generate types directly from the Nexus GraphQL endpoint. This way, you essentially only have to define the types once in the `schema.prisma` file as the single-source-of-truth, then all types you'll use in the application can be derived from that schema with little manual effort! 🎉

First, copy and refactor the GraphQL queries from the TSX files into the `graphql` directory. With the example from Step 8, create a new file at `/graphql/queries.graphql.ts` and copy the query from `/components/AllUsers.tsx`:

```tsx
import gql from "graphql-tag";

export const AllUsersQuery = gql`
  query AllUsers {
    allUsers {
      id
      name
    }
  }
`;
```

_Separating GraphQL operations from components makes it easier to navigate the codebase._

Next, install the packages needed by `graphql-code-generator` as dev dependencies:

```bash
npm install -D \
    @graphql-codegen/cli \
    @graphql-codegen/typescript \
    @graphql-codegen/typescript-operations \
    @graphql-codegen/typescript-urql
```

Then, create a `codegen.yml` file in the project root with the following content:

```yaml
overwrite: true
schema: "http://localhost:4000/graphql" # GraphQL endpoint via the nexus dev server
documents: "graphql/**/*.graphql.ts" # parse graphql operations in matching files
generates:
  generated/graphql.tsx: # location for generated types, hooks and components
    plugins:
      - "typescript"
      - "typescript-operations"
      - "typescript-urql"
    config:
      withComponent: false # we'll use Urql client with hooks instead
      withHooks: true
```

The configs above will tell `graphql-code-generator` to pull the GraphQL schema from `http://localhost:4000/graphql`, then generate types, Urql `useQuery` hooks into a file located at `/generated/graphql.tsx`.

Cool, let the code generation begin (in _watch_ mode)!

```yaml
npx graphql-codegen --watch
```

You will see some nice, written-by-a-robot code in `/generated/graphql.tsx`. How neat!

![A `useAllUsersQuery` hook and all the types are generated by GraphQL Code Generator](https://i.imgur.com/d7PCb0a.png)<figcaption>A <code>useAllUsersQuery</code> hook and all the types are generated by GraphQL Code Generator</figcaption>

Now, you can go back to `components/AllUsers.tsx`, and replace the manually written `AllUsersData` type, the GraphQL query, and the `useQuery` hook, with what's in the `/generated/graphql.tsx` file:

```tsx
import React from "react";
import { useAllUsersQuery } from "../generated/graphql";

const AllUsers: React.FC = () => {
  const [result] = useAllUsersQuery();
  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return (
    <div>
      <p>There are {data?.allUsers?.length} user(s) in the database:</p>
      <ul>
        {data?.allUsers?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default AllUsers;
```

Revisit the index page of the app at [http://localhost:3000](http://localhost:3000), everything works like a charm! 🙌

To make the development experience even better, let's optimize the NPM scripts for the project.

First, install the _[Concurrently](https://github.com/kimmobrunfeldt/concurrently)_ NPM module, which is a great tool for running multiple CLI watchers at the same time:

```bash
npm install -D concurrently
```

Then, replace `dev` script in the `package.json` file with the following:

```json
{
  // ...
  "scripts": {
    // ...
    "dev": "concurrently -r \"npx nexus dev\" \"npx next\" \"npx graphql-codegen --watch\""
    // ...
  }
  // ...
}
```

Now, we can use a single `npm run dev` command to launch Nexus, Next.js, and GraphQL Code Generator, all at the same time!

## Conclusion

I hope you have enjoyed this tutorial and have learned something useful! You can always find the source code and [step-by-step commits](https://github.com/hexrcs/fullstack-graphql-next-nexus-prisma/commits/master) in [this GitHub repo](https://github.com/hexrcs/fullstack-graphql-next-nexus-prisma).

Also, check out the [Awesome Prisma list](https://github.com/catalinmiron/awesome-prisma) for more tutorials and starter projects in the Prisma ecosystem!
