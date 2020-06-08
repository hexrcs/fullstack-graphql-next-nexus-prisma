import app, { server } from "nexus";
import "../../graphql/schema"; // we'll create this file in a second!

app.assemble();

export default server.handlers.graphql;
