module.exports = {
  openapi: "3.0.0",
  info: { title: "Workout Tracker API", version: "1.0.0", description: "Sessions + Workouts API" },
  servers: [{ url: "http://localhost:8080" }],
  paths: {
    "/health": { get: { summary: "Health check", responses: { 200: { description: "OK" } } } },
    "/api/sessions": {
      get: {
        summary: "List sessions",
        parameters: [
          { name:"scope", in:"query", schema:{type:"string", enum:["community","mine"]} },
          { name:"userId", in:"query", schema:{type:"string"} }
        ],
        responses: { 200: { description:"OK" } }
      },
      post: {
        summary: "Create session",
        requestBody: { required: true, content: { "application/json": { schema: { $ref:"#/components/schemas/SessionCreate" } } } },
        responses: { 201: { description:"Created" }, 400: { description:"Bad Request" } }
      }
    },
    "/api/sessions/{id}": {
      delete: {
        summary: "Delete session",
        parameters: [{ name:"id", in:"path", required:true, schema:{type:"string"} }],
        responses: { 204: { description:"Deleted" } }
      }
    },
    "/api/sessions/{id}/exercise": {
      post: {
        summary:"Add exercise",
        parameters: [{ name:"id", in:"path", required:true, schema:{type:"string"} }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref:"#/components/schemas/Exercise" } } } },
        responses:{ 200:{ description:"Updated" } }
      }
    },
    "/api/sessions/{id}/exercise/{idx}": {
      delete: {
        summary:"Delete exercise by index",
        parameters: [
          { name:"id", in:"path", required:true, schema:{type:"string"} },
          { name:"idx", in:"path", required:true, schema:{type:"integer"} }
        ],
        responses:{ 200:{ description:"Updated" } }
      }
    },
    "/api/workouts": {
      get: { summary:"List workouts", responses:{ 200:{ description:"OK" } } },
      post:{
        summary:"Create workout",
        requestBody:{ required:true, content:{ "application/json":{ schema:{ $ref:"#/components/schemas/Workout" } } } },
        responses:{ 201:{ description:"Created" } }
      }
    },
    "/api/workouts/{id}": {
      delete:{
        summary:"Delete workout",
        parameters:[{ name:"id", in:"path", required:true, schema:{type:"string"} }],
        responses:{ 204:{ description:"Deleted" } }
      }
    }
  },
  components: {
    schemas: {
      Exercise: {
        type: "object",
        properties: { title:{type:"string"}, sets:{type:"integer"}, reps:{type:"integer"}, weight:{type:"number"} },
        required: ["title","sets","reps","weight"]
      },
      SessionCreate: {
        type: "object",
        properties: { name:{type:"string"}, date:{type:"string",format:"date-time"}, userId:{type:"string"}, userName:{type:"string"}, isPublic:{type:"boolean"} },
        required: ["name","userId"]
      },
      Workout: {
        type: "object",
        properties: { title:{type:"string"}, sets:{type:"integer"}, reps:{type:"integer"}, weight:{type:"number"} },
        required: ["title","sets","reps","weight"]
      }
    }
  }
};
