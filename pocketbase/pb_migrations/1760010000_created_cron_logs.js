/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const cronLogsCollection = new Collection({
        "name": "cron_logs",
        "type": "base",
        "system": false,
        "listRule": "",
        "viewRule": "",
        "fields": [
            {
                "name": "job_name",
                "type": "text",
                "required": true,
                "min": 1,
                "max": 100
            },
            {
                "name": "status",
                "type": "select",
                "required": true,
                "values": [
                    "started",
                    "success",
                    "failed"
                ]
            },
            {
                "name": "message",
                "type": "text",
                "required": true,
                "max": 2000
            },
            {
                "name": "records_processed",
                "type": "number",
                "required": false,
                "min": 0
            },
            {
                "name": "details",
                "type": "json",
                "required": false
            }
        ],
        "indexes": [
            "CREATE INDEX idx_cron_logs_job_name ON cron_logs (job_name)",
            "CREATE INDEX idx_cron_logs_status ON cron_logs (status)"
        ]
    })

    app.save(cronLogsCollection)
}, (app) => {
    const cronLogsCollection = app.findCollectionByNameOrId("cron_logs")
    app.delete(cronLogsCollection)
})
