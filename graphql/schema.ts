import { schema, use } from "nexus";
import { prisma } from "nexus-plugin-prisma";

use(prisma({ features: { crud: true } }));

schema.objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.name();
  },
});

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
