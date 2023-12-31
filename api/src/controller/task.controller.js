const authenticateSession = require("../middlewares/sessionAuthenticator");
const { Task } = require("../models/task.model");
const mongoose = require("mongoose");

const router = require("express").Router();

// ----------- FETCH TASK-------------//
router.get("/", authenticateSession, async (req, res) => {
  if (!req?.session?.user) {
    return res.status(404).json({
      ok: false,
      status: 200,
      message: "You are not authorized",
    });
  }
  try {
    let page = req?.query?.page || 1;
    let pageSize = 3;
    let tasks = await Task.find({ "people" : req?.session?.user?._id })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Task fetched successfully",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error,
    });
  }
});
// --------------FIND TASKS--------------//
const call = {};
router.get("/search", authenticateSession , async (req, res) => {
  try {
    clearTimeout(call.timeout);

    call.timeout = setTimeout(async () => {
      const keyword = req.query?.tag; 

      if (!keyword) {
        return res.status(400).json({
          status : 400,
          ok : false,
          message : "Keyword is required"
        });
      }

      const regexPattern = new RegExp(keyword, "i");

      const tasks = await Task.find({ tags: { $regex: regexPattern } });

      if (!tasks || tasks.length === 0) {
        return res
          .status(404)
          .json({
            ok : false,
            status : 404,
            message : "No tasks found with matching tag"
          });
      }

      return res.status(200).json({
        ok : true,
        status : 200,
        message : "Task found",
        data  : tasks
      });
    }, 300);
  } catch (error) {
    return res.status(500).json({
      ok : false,
      status : 500,
      message : error
    });
  }
});

// ------------GET TASK WORK STATUS CATEGORY-------------//
router.get("/work-status-category", authenticateSession, async (req, res) => {

  try {
    let tasks = await Task.find({ "people" : req?.session?.user?._id })

    const countByStatus = {
      'In Progress': 0,
      'On Hold': 0,
      'Completed': 0,
    };

    tasks.forEach(task => {
      const status = task.work_status;

      if (countByStatus.hasOwnProperty(status)) {
        countByStatus[status]++;
      }
    });

    return res.status(200).json({
      ok: true,
      status: 200,
      message: "Task Work Status categories successfully",
      data: countByStatus,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error.message || "Internal Server Error",
    });
  }
});

// ------------FETCH TASK BY ID-------------//
router.get("/:taskId", authenticateSession, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({
        ok: true,
        status: 400,
        message: "Invalid task Id",
      });
    }
    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        ok: true,
        status: 404,
        message: "Task doesn't exist in our database",
      });
    }

    return res.status(200).json({
      ok: true,
      status: 200,
      data: task,
      message: "Task fetch successfully",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error,
    });
  }
});
// ------------CREATED TASK-------------//
router.post("/create", authenticateSession, async (req, res) => {
  try {
    let task = new Task({
      title: req.body.title,
      createdBy: req.session.user._id,
      description: req.body.description,
      dueDate: req.body.dueDate,
      work_status: req.body.work_status,
      priority: req.body.priority,
      people: [req?.session?.user?._id],
      assignedTo: req?.body?.assignedTo,
      reporter: req?.body?.reporter,
      tags: [...req.body.tags],
      comments: [],
    });
    await task.save();
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Task created successfully",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error,
    });
  }
});

// ------------UPDATE TASK-------------//
router.patch("/update/:taskId", authenticateSession, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({
        ok: true,
        status: 400,
        message: "Invalid task Id",
      });
    }
    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Task doesn't exist in our database",
      });
    }

    const updatedTask = await Task.updateOne(
      { _id: req.params.taskId },
      req.body
    );
    if (updatedTask.modifiedCount === 1) {
      return res.status(200).json({
        ok: true,
        status: 200,
        message: "Task updated successfully",
      });
    } else {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "Task updation failed",
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error,
    });
  }
});

// ------------ REMOVE MEMBER-----------//
router.patch(
  "/remove-member/:taskId",
  authenticateSession,
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({
          ok: false,
          status: 400,
          message: "Invalid task Id",
        });
      }

      const updatedTask = await Task.updateOne(
        { _id: req.params.taskId },
        { $pull: { people: req.body.memberToRemove?._id } }
      );

      console.log(updatedTask);
      if (updatedTask.modifiedCount === 1) {
        return res.status(200).json({
          ok: true,
          status: 200,
          message: `${req.body.memberToRemove?.name} removed from the task successfully`,
        });
      } else {
        return res.status(400).json({
          ok: false,
          status: 400,
          message: "User removal failed or user not found in the task",
        });
      }
    } catch (error) {
      res.status(500).json({
        ok: false,
        status: 500,
        message: error.message,
      });
    }
  }
);

// ------------DELETE TASK-------------//
router.delete("/delete/:taskId", authenticateSession, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({
        ok: true,
        status: 400,
        message: "Invalid task Id",
      });
    }
    let result = await Task.findByIdAndDelete(req.params.taskId);
    if (!result) {
      return res.status(404).json({
        ok: true,
        status: 404,
        message: "Task doesn't exist in our database",
      });
    }

    return res.status(404).json({
      ok: true,
      status: 404,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error,
    });
  }
});

// --------------ADD PEOPLE------------//
router.patch("/invite/:taskId", authenticateSession, async (req, res) => {
  try {
    // if(!mongoose.Schema.Types.ObjectId.isValid(req.params.taskId)){
    //   return res.status(400).json({
    //     ok : false,
    //     status :400,
    //     message : 'taskId is not present in our database'
    //   })
    // }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json("Task not found");
    }

    const { memberToAdd } = req.body;

    task.people.push(memberToAdd?._id);

    await task.save();
    res.status(200).json({
      ok: true,
      status: 200,
      message: `${memberToAdd?.name} added successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      status: 500,
      message: error,
    });
  }
});






module.exports = router;
