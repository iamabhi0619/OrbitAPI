const fs = require("fs");
const path = require("path");
const ApiError = require("../utils/ApiError");

// Log File Path
const logFilePath = path.join(__dirname, "..", "logs", "app.log");
const archiveFilePath = path.join(__dirname, "..", "logs", "archive.log");

// Utility to parse logs safely
const parseLogs = (data) =>
    data
        .split("\n")
        .filter(Boolean)
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        })
        .filter(Boolean);

exports.getAllLogs = (req, res, next) => {
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        const logLines = parseLogs(data).reverse();
        res.json(logLines);
    });
};

exports.searchAndFilterLogs = (req, res, next) => {
    const { level, from, to, keyword } = req.query;
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        let logs = parseLogs(data).reverse();
        if (level) logs = logs.filter((log) => log.level === level);
        if (from || to) {
            const fromDate = new Date(from || "1970-01-01");
            const toDate = new Date(to || Date.now());
            logs = logs.filter((log) => {
                const logDate = new Date(log.timestamp);
                return logDate >= fromDate && logDate <= toDate;
            });
        }
        if (keyword) logs = logs.filter((log) => log.message.includes(keyword));
        res.json(logs);
    });
};

exports.downloadLogs = (req, res, next) => {
    const format = req.query.format || "json";
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        let content = data;
        if (format === "json") {
            content = JSON.stringify(parseLogs(data), null, 2);
        }
        res.setHeader("Content-Disposition", `attachment; filename=logs.${format === "txt" ? "txt" : "json"}`);
        res.send(content);
    });
};

exports.paginateLogs = (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        const logs = parseLogs(data);
        const start = (page - 1) * limit;
        res.json({ total: logs.length, page, limit, logs: logs.slice(start, start + limit) });
    });
};

exports.logSummary = (req, res, next) => {
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        const logs = parseLogs(data);
        const summary = logs.reduce(
            (acc, log) => {
                acc.levels[log.level] = (acc.levels[log.level] || 0) + 1;
                acc.total++;
                const logDate = new Date(log.timestamp);
                if (logDate < acc.dateRange.start) acc.dateRange.start = logDate;
                if (logDate > acc.dateRange.end) acc.dateRange.end = logDate;
                return acc;
            },
            { total: 0, levels: {}, dateRange: { start: new Date(), end: new Date(0) } }
        );
        res.json(summary);
    });
};

exports.archiveOldLogs = (req, res, next) => {
    const { before } = req.query;
    if (!before) return next(new ApiError(400, "'before' date is required", "MISSING_DATE"));
    const beforeDate = new Date(before);
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        const lines = data.split("\n").filter(Boolean);
        const old = [], remaining = [];
        lines.forEach((line) => {
            try {
                const log = JSON.parse(line);
                new Date(log.timestamp) < beforeDate ? old.push(line) : remaining.push(line);
            } catch { }
        });
        fs.appendFile(archiveFilePath, old.join("\n") + "\n", (err) => {
            if (err) return next(new ApiError(500, "Failed to archive logs", "ARCHIVE_ERROR"));
            fs.writeFile(logFilePath, remaining.join("\n") + "\n", (err) => {
                if (err) return next(new ApiError(500, "Failed to update log file", "LOG_UPDATE_ERROR"));
                res.send("Old logs archived successfully");
            });
        });
    });
};

exports.bulkUpdateOrDeleteLogs = (req, res, next) => {
    const { action, ids } = req.body;
    if (!Array.isArray(ids) || !action)
        return next(new ApiError(400, "Invalid request body", "INVALID_BODY"));
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        let logs = parseLogs(data);
        if (action === "delete") logs = logs.filter((log) => !ids.includes(log.id));
        else if (action === "markImportant")
            logs = logs.map((log) => (ids.includes(log.id) ? { ...log, important: true } : log));
        else return next(new ApiError(400, "Invalid action", "INVALID_ACTION"));
        fs.writeFile(logFilePath, logs.map((log) => JSON.stringify(log)).join("\n") + "\n", (err) => {
            if (err) return next(new ApiError(500, "Unable to update log file", "LOG_UPDATE_ERROR"));
            res.send("Logs updated successfully");
        });
    });
};

exports.markLogImportant = (req, res, next) => {
    const { id } = req.body;
    if (!id) return next(new ApiError(400, "Log ID is required", "MISSING_ID"));
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        let logs = parseLogs(data);
        const found = logs.find((log) => log.id === id);
        if (!found) return next(new ApiError(404, "Log not found", "NOT_FOUND"));
        found.important = true;
        fs.writeFile(logFilePath, logs.map((log) => JSON.stringify(log)).join("\n") + "\n", (err) => {
            if (err) return next(new ApiError(500, "Unable to update log file", "LOG_UPDATE_ERROR"));
            res.send("Log marked as important");
        });
    });
};

exports.unmarkLogImportant = (req, res, next) => {
    const { id } = req.body;
    if (!id) return next(new ApiError(400, "Log ID is required", "MISSING_ID"));
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) return next(new ApiError(500, "Unable to read log file", "LOG_READ_ERROR"));
        let logs = parseLogs(data);
        const log = logs.find((l) => l.id === id);
        if (!log) return next(new ApiError(404, "Log not found", "NOT_FOUND"));
        log.important = false;
        fs.writeFile(logFilePath, logs.map((l) => JSON.stringify(l)).join("\n") + "\n", (err) => {
            if (err) return next(new ApiError(500, "Unable to update log file", "LOG_UPDATE_ERROR"));
            res.send("Log unmarked as important");
        });
    });
};
