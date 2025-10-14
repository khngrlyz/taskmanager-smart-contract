const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TaskManager", function () {
  // Fixture to deploy the contract
  async function deployTaskManagerFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const TaskManager = await ethers.getContractFactory("TaskManager");
    const taskManager = await TaskManager.deploy();
    return { taskManager, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);
      expect(await taskManager.getTotalTaskCount()).to.equal(0);
    });
  });

  describe("Task Creation", function () {
    it("Should create a task successfully", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await expect(taskManager.createTask("Test Task", "This is a test task"))
        .to.emit(taskManager, "TaskCreated")
        .withArgs(1, owner.address, "Test Task");

      expect(await taskManager.getTotalTaskCount()).to.equal(1);
      expect(await taskManager.getUserTaskCount(owner.address)).to.equal(1);
    });

    it("Should not allow empty title", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      await expect(
        taskManager.createTask("", "Description")
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should create multiple tasks for the same user", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Task 1", "Description 1");
      await taskManager.createTask("Task 2", "Description 2");
      await taskManager.createTask("Task 3", "Description 3");

      expect(await taskManager.getUserTaskCount(owner.address)).to.equal(3);
      expect(await taskManager.getTotalTaskCount()).to.equal(3);
    });

    it("Should create tasks for different users", async function () {
      const { taskManager, owner, addr1 } = await loadFixture(deployTaskManagerFixture);

      await taskManager.connect(owner).createTask("Owner Task", "Owner's task");
      await taskManager.connect(addr1).createTask("Addr1 Task", "Addr1's task");

      expect(await taskManager.getUserTaskCount(owner.address)).to.equal(1);
      expect(await taskManager.getUserTaskCount(addr1.address)).to.equal(1);
      expect(await taskManager.getTotalTaskCount()).to.equal(2);
    });
  });

  describe("Task Retrieval", function () {
    it("Should retrieve a task correctly", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Test Description");

      const task = await taskManager.getTask(1);
      expect(task.id).to.equal(1);
      expect(task.title).to.equal("Test Task");
      expect(task.description).to.equal("Test Description");
      expect(task.status).to.equal(0); // Pending
      expect(task.owner).to.equal(owner.address);
    });

    it("Should retrieve all user tasks", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Task 1", "Description 1");
      await taskManager.createTask("Task 2", "Description 2");

      const taskIds = await taskManager.getUserTasks(owner.address);
      expect(taskIds.length).to.equal(2);
      expect(taskIds[0]).to.equal(1);
      expect(taskIds[1]).to.equal(2);
    });

    it("Should retrieve all user task details", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Task 1", "Description 1");
      await taskManager.createTask("Task 2", "Description 2");

      const tasks = await taskManager.getUserTaskDetails(owner.address);
      expect(tasks.length).to.equal(2);
      expect(tasks[0].title).to.equal("Task 1");
      expect(tasks[1].title).to.equal("Task 2");
    });

    it("Should revert when retrieving non-existent task", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      await expect(taskManager.getTask(999)).to.be.revertedWith("Task does not exist");
    });
  });

  describe("Task Updates", function () {
    it("Should update a task successfully", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Original Title", "Original Description");

      await expect(taskManager.updateTask(1, "Updated Title", "Updated Description"))
        .to.emit(taskManager, "TaskUpdated")
        .withArgs(1, "Updated Title", 0); // 0 is Pending status

      const task = await taskManager.getTask(1);
      expect(task.title).to.equal("Updated Title");
      expect(task.description).to.equal("Updated Description");
    });

    it("Should update task status", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Description");

      await expect(taskManager.updateTaskStatus(1, 1)) // 1 is InProgress
        .to.emit(taskManager, "TaskStatusChanged")
        .withArgs(1, 1);

      const task = await taskManager.getTask(1);
      expect(task.status).to.equal(1);
    });

    it("Should not allow non-owner to update task", async function () {
      const { taskManager, addr1 } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Description");

      await expect(
        taskManager.connect(addr1).updateTask(1, "Hacked", "Hacked Description")
      ).to.be.revertedWith("Not the task owner");
    });

    it("Should not allow empty title on update", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Description");

      await expect(
        taskManager.updateTask(1, "", "Updated Description")
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should update timestamp on task update", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Description");
      const taskBefore = await taskManager.getTask(1);

      // Wait a bit and update
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine");

      await taskManager.updateTask(1, "Updated Title", "Updated Description");
      const taskAfter = await taskManager.getTask(1);

      expect(taskAfter.updatedAt).to.be.greaterThan(taskBefore.updatedAt);
    });
  });

  describe("Task Deletion", function () {
    it("Should delete a task successfully", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Description");

      await expect(taskManager.deleteTask(1))
        .to.emit(taskManager, "TaskDeleted")
        .withArgs(1, owner.address);

      expect(await taskManager.getUserTaskCount(owner.address)).to.equal(0);
      await expect(taskManager.getTask(1)).to.be.revertedWith("Task does not exist");
    });

    it("Should not allow non-owner to delete task", async function () {
      const { taskManager, addr1 } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Test Task", "Description");

      await expect(
        taskManager.connect(addr1).deleteTask(1)
      ).to.be.revertedWith("Not the task owner");
    });

    it("Should remove task from user task list", async function () {
      const { taskManager, owner } = await loadFixture(deployTaskManagerFixture);

      await taskManager.createTask("Task 1", "Description 1");
      await taskManager.createTask("Task 2", "Description 2");
      await taskManager.createTask("Task 3", "Description 3");

      await taskManager.deleteTask(2);

      const taskIds = await taskManager.getUserTasks(owner.address);
      expect(taskIds.length).to.equal(2);
      expect(taskIds).to.not.include(2);
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle complete task lifecycle", async function () {
      const { taskManager } = await loadFixture(deployTaskManagerFixture);

      // Create task
      await taskManager.createTask("Complete Lifecycle", "Testing full lifecycle");

      // Update to In Progress
      await taskManager.updateTaskStatus(1, 1);
      let task = await taskManager.getTask(1);
      expect(task.status).to.equal(1);

      // Update task content
      await taskManager.updateTask(1, "Updated Lifecycle", "Updated description");
      task = await taskManager.getTask(1);
      expect(task.title).to.equal("Updated Lifecycle");

      // Complete the task
      await taskManager.updateTaskStatus(1, 2);
      task = await taskManager.getTask(1);
      expect(task.status).to.equal(2);

      // Delete the task
      await taskManager.deleteTask(1);
      await expect(taskManager.getTask(1)).to.be.revertedWith("Task does not exist");
    });

    it("Should maintain separate task lists for different users", async function () {
      const { taskManager, owner, addr1, addr2 } = await loadFixture(deployTaskManagerFixture);

      await taskManager.connect(owner).createTask("Owner Task 1", "Description");
      await taskManager.connect(owner).createTask("Owner Task 2", "Description");
      await taskManager.connect(addr1).createTask("Addr1 Task 1", "Description");
      await taskManager.connect(addr2).createTask("Addr2 Task 1", "Description");

      expect(await taskManager.getUserTaskCount(owner.address)).to.equal(2);
      expect(await taskManager.getUserTaskCount(addr1.address)).to.equal(1);
      expect(await taskManager.getUserTaskCount(addr2.address)).to.equal(1);

      const ownerTasks = await taskManager.getUserTaskDetails(owner.address);
      expect(ownerTasks[0].title).to.equal("Owner Task 1");
      expect(ownerTasks[1].title).to.equal("Owner Task 2");
    });
  });
});
