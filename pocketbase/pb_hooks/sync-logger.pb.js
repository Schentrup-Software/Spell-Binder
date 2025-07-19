// Enhanced logging utility for sync operations
// Provides structured logging with different levels and persistent log storage

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
}

const LOG_LEVEL_NAMES = ["ERROR", "WARN", "INFO", "DEBUG"]

// Current log level (can be configured via environment or settings)
let currentLogLevel = LOG_LEVELS.INFO

// Log entry structure for database storage
function createLogEntry(level, message, context = {}) {
    return {
        timestamp: new Date().toISOString(),
        level: LOG_LEVEL_NAMES[level],
        message: message,
        context: context,
        source: "sync-system"
    }
}

// Enhanced console logging with timestamps and levels
function logToConsole(level, message, context = {}) {
    if (level > currentLogLevel) {
        return
    }

    const timestamp = new Date().toISOString()
    const levelName = LOG_LEVEL_NAMES[level]
    const contextStr = Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(context)}` : ""

    const logMessage = `[${timestamp}] [${levelName}] [SYNC] ${message}${contextStr}`

    switch (level) {
        case LOG_LEVELS.ERROR:
            console.error(logMessage)
            break
        case LOG_LEVELS.WARN:
            console.warn(logMessage)
            break
        default:
            console.log(logMessage)
            break
    }
}

// Store critical logs in database for persistence (optional feature)
function persistLog(level, message, context = {}) {
    // Only persist ERROR and WARN level logs to avoid database bloat
    if (level > LOG_LEVELS.WARN) {
        return
    }

    try {
        // Check if logs collection exists, create if needed
        let logsCollection = null
        try {
            logsCollection = $app.dao().findCollectionByNameOrId("sync_logs")
        } catch (err) {
            // Collection doesn't exist, create it
            logsCollection = new Collection()
            logsCollection.name = "sync_logs"
            logsCollection.type = "base"
            logsCollection.schema = [
                {
                    name: "level",
                    type: "select",
                    required: true,
                    options: {
                        values: ["ERROR", "WARN", "INFO", "DEBUG"]
                    }
                },
                {
                    name: "message",
                    type: "text",
                    required: true,
                    options: {
                        max: 1000
                    }
                },
                {
                    name: "context",
                    type: "json",
                    required: false
                },
                {
                    name: "source",
                    type: "text",
                    required: true,
                    options: {
                        max: 50
                    }
                }
            ]
            logsCollection.indexes = [
                "CREATE INDEX idx_sync_logs_level ON sync_logs (level)",
                "CREATE INDEX idx_sync_logs_created ON sync_logs (created)",
                "CREATE INDEX idx_sync_logs_source ON sync_logs (source)"
            ]
            $app.dao().saveCollection(logsCollection)
        }

        // Create log record
        const logRecord = new Record(logsCollection)
        logRecord.set("level", LOG_LEVEL_NAMES[level])
        logRecord.set("message", message)
        logRecord.set("context", context)
        logRecord.set("source", "sync-system")

        $app.dao().saveRecord(logRecord)

    } catch (error) {
        // Don't let logging errors break the main sync process
        console.error("Failed to persist log entry:", error.message)
    }
}

// Main logging functions
const SyncLogger = {
    error: function (message, context = {}) {
        logToConsole(LOG_LEVELS.ERROR, message, context)
        persistLog(LOG_LEVELS.ERROR, message, context)
    },

    warn: function (message, context = {}) {
        logToConsole(LOG_LEVELS.WARN, message, context)
        persistLog(LOG_LEVELS.WARN, message, context)
    },

    info: function (message, context = {}) {
        logToConsole(LOG_LEVELS.INFO, message, context)
    },

    debug: function (message, context = {}) {
        logToConsole(LOG_LEVELS.DEBUG, message, context)
    },

    // Set log level dynamically
    setLevel: function (level) {
        if (typeof level === 'string') {
            const levelIndex = LOG_LEVEL_NAMES.indexOf(level.toUpperCase())
            if (levelIndex !== -1) {
                currentLogLevel = levelIndex
                this.info(`Log level set to ${level.toUpperCase()}`)
            } else {
                this.warn(`Invalid log level: ${level}`)
            }
        } else if (typeof level === 'number' && level >= 0 && level <= 3) {
            currentLogLevel = level
            this.info(`Log level set to ${LOG_LEVEL_NAMES[level]}`)
        }
    },

    // Get current log level
    getLevel: function () {
        return {
            numeric: currentLogLevel,
            name: LOG_LEVEL_NAMES[currentLogLevel]
        }
    },

    // Clean up old log entries (call periodically to prevent database bloat)
    cleanup: function (daysToKeep = 30) {
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

            const oldLogs = $app.dao().findRecordsByFilter(
                "sync_logs",
                `created < "${cutoffDate.toISOString()}"`,
                "",
                500,
                0
            )

            let deletedCount = 0
            for (const logRecord of oldLogs) {
                try {
                    $app.dao().deleteRecord(logRecord)
                    deletedCount++
                } catch (error) {
                    this.warn("Failed to delete old log entry", {
                        logId: logRecord.id,
                        error: error.message
                    })
                }
            }

            if (deletedCount > 0) {
                this.info(`Cleaned up ${deletedCount} old log entries`)
            }

        } catch (error) {
            this.error("Failed to cleanup old logs", { error: error.message })
        }
    }
}

// Export for use in other sync modules
// Note: PocketBase doesn't support CommonJS modules or Node.js globals
// Use simple variable assignment instead

SyncLogger.info("Sync logging system initialized")