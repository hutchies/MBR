/// <reference path="../pb_data/types.d.ts" />
// Public "suggest an item" queue for the bibliography (PocketBase >= 0.23).
// Anyone may create; only signed-in editors (mbr_users) can see or triage.
migrate((app) => {
    const editorsOnly = "@request.auth.collectionName = 'mbr_users'";
    const collection = new Collection({
        type: "base",
        name: "suggestions",
        listRule: editorsOnly,
        viewRule: editorsOnly,
        // Anonymous submissions always land in the queue as "new".
        createRule: "@request.body.status = 'new'",
        updateRule: editorsOnly,
        deleteRule: editorsOnly,
        fields: [
            { name: "author", type: "text", required: true, max: 500 },
            { name: "citation", type: "text", required: true, max: 4000 },
            { name: "annotation", type: "text", max: 20000 },
            { name: "notes", type: "text", max: 4000 },
            { name: "submitter_name", type: "text", max: 200 },
            { name: "submitter_email", type: "email" },
            { name: "status", type: "select", required: true, maxSelect: 1, values: ["new", "accepted", "dismissed"] },
            { name: "record", type: "number", onlyInt: true },
            { name: "created", type: "autodate", onCreate: true, onUpdate: false },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
    });
    app.save(collection);
}, (app) => {
    app.delete(app.findCollectionByNameOrId("suggestions"));
});
