const fs = require("fs");
const path = require("path");

// Log File Path
const logFilePath = path.join(__dirname, "..", "service", "logs", "app.log");

const archiveFilePath = path.join(__dirname, "..", "service", "logs", "archive.log");

// **1. Get All Logs**
exports.getAllLogs = (req, res) => {
  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");
    const logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse();
    res.json(logLines);
  });
};

// **2. Search and Filter Logs**
exports.searchAndFilterLogs = (req, res) => {
  const { level, from, to, keyword } = req.query;

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    let logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse();

    if (level) logLines = logLines.filter((log) => log.level === level);
    if (from || to) {
      const fromDate = new Date(from || "1970-01-01");
      const toDate = new Date(to || Date.now());
      logLines = logLines.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= fromDate && logDate <= toDate;
      });
    }
    if (keyword) logLines = logLines.filter((log) => log.message.includes(keyword));

    res.json(logLines);
  });
};

// **3. Download Logs**
exports.downloadLogs = (req, res) => {
  const format = req.query.format || "json";

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    let content = data;
    if (format === "json") {
      content = JSON.stringify(
        data
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line)),
        null,
        2
      );
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=logs.${format === "txt" ? "txt" : "json"}`
    );
    res.send(content);
  });
};

// **4. Pagination for Logs**
exports.paginateLogs = (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    const logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    res.json({
      total: logLines.length,
      page,
      limit,
      logs: logLines.slice(startIndex, endIndex),
    });
  });
};

// **5. Log Summary and Analytics**
exports.logSummary = (req, res) => {
  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    const logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    const summary = logLines.reduce(
      (acc, log) => {
        acc.levels[log.level] = (acc.levels[log.level] || 0) + 1;
        acc.total += 1;
        const logDate = new Date(log.timestamp);
        if (logDate < acc.dateRange.start) acc.dateRange.start = logDate;
        if (logDate > acc.dateRange.end) acc.dateRange.end = logDate;
        return acc;
      },
      {
        total: 0,
        levels: {},
        dateRange: { start: new Date(), end: new Date(0) },
      }
    );

    res.json(summary);
  });
};

// **6. Archive Old Logs**
exports.archiveOldLogs = (req, res) => {
  const { before } = req.query;

  if (!before) return res.status(400).send("Please provide a 'before' date");

  const beforeDate = new Date(before);

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    const logLines = data.split("\n").filter(Boolean);
    const oldLogs = [];
    const remainingLogs = [];

    logLines.forEach((line) => {
      const log = JSON.parse(line);
      const logDate = new Date(log.timestamp);
      if (logDate < beforeDate) oldLogs.push(line);
      else remainingLogs.push(line);
    });

    fs.appendFile(archiveFilePath, oldLogs.join("\n") + "\n", (err) => {
      if (err) return res.status(500).send("Unable to archive old logs");

      fs.writeFile(logFilePath, remainingLogs.join("\n") + "\n", (err) => {
        if (err) return res.status(500).send("Unable to update log file");
        res.send("Old logs archived successfully");
      });
    });
  });
};

// **7. Bulk Update or Delete Logs**
exports.bulkUpdateOrDeleteLogs = (req, res) => {
  const { action, ids } = req.body;

  if (!Array.isArray(ids) || !action) return res.status(400).send("Invalid request body");

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    let logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    if (action === "delete") {
      logLines = logLines.filter((log) => !ids.includes(log.id));
    } else if (action === "markImportant") {
      logLines = logLines.map((log) => {
        if (ids.includes(log.id)) log.important = true;
        return log;
      });
    } else {
      return res.status(400).send("Invalid action");
    }

    fs.writeFile(logFilePath, logLines.map((log) => JSON.stringify(log)).join("\n"), (err) => {
      if (err) return res.status(500).send("Unable to update log file");
      res.send("Logs updated successfully");
    });
  });
};

// **8. Mark a Log as Important**
exports.markLogImportant = (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).send("Log ID is required");

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    let logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    let logFound = false;
    logLines = logLines.map((log) => {
      if (log.id === id) {
        log.important = true;
        logFound = true;
      }
      return log;
    });

    if (!logFound) return res.status(404).send("Log not found");

    fs.writeFile(logFilePath, logLines.map((log) => JSON.stringify(log)).join("\n"), (err) => {
      if (err) return res.status(500).send("Unable to update log file");
      res.send("Log marked as important");
    });
  });
};

// **Unmark Log as Important**
exports.unmarkLogImportant = (req, res) => {
  const { id } = req.body;

  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Unable to read log file");

    let logLines = data
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    const logIndex = logLines.findIndex((log) => log.id === id);
    if (logIndex === -1) return res.status(404).send("Log not found");

    logLines[logIndex].important = false;

    fs.writeFile(logFilePath, logLines.map((log) => JSON.stringify(log)).join("\n"), (err) => {
      if (err) return res.status(500).send("Unable to update log file");
      res.send("Log unmarked as important");
    });
  });
};
