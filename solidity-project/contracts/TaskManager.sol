// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TaskManager
 * @dev A decentralized task management system where users can create, update, and manage their tasks on-chain
 * @notice This contract demonstrates key Solidity concepts including structs, mappings, events, and access control
 */
contract TaskManager {
    // Enum to represent task status
    enum TaskStatus {
        Pending,
        InProgress,
        Completed,
        Cancelled
    }

    // Struct to represent a task
    struct Task {
        uint256 id;
        string title;
        string description;
        TaskStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        address owner;
    }

    // State variables
    uint256 private taskCounter;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) private userTasks;

    // Events
    event TaskCreated(uint256 indexed taskId, address indexed owner, string title);
    event TaskUpdated(uint256 indexed taskId, string title, TaskStatus status);
    event TaskDeleted(uint256 indexed taskId, address indexed owner);
    event TaskStatusChanged(uint256 indexed taskId, TaskStatus newStatus);

    // Modifiers
    modifier onlyTaskOwner(uint256 _taskId) {
        require(tasks[_taskId].owner == msg.sender, "Not the task owner");
        _;
    }

    modifier taskExists(uint256 _taskId) {
        require(tasks[_taskId].owner != address(0), "Task does not exist");
        _;
    }

    /**
     * @dev Create a new task
     * @param _title The title of the task
     * @param _description The description of the task
     * @return The ID of the newly created task
     */
    function createTask(string memory _title, string memory _description) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");

        taskCounter++;
        uint256 newTaskId = taskCounter;

        Task memory newTask = Task({
            id: newTaskId,
            title: _title,
            description: _description,
            status: TaskStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            owner: msg.sender
        });

        tasks[newTaskId] = newTask;
        userTasks[msg.sender].push(newTaskId);

        emit TaskCreated(newTaskId, msg.sender, _title);
        return newTaskId;
    }

    /**
     * @dev Update an existing task
     * @param _taskId The ID of the task to update
     * @param _title The new title
     * @param _description The new description
     */
    function updateTask(
        uint256 _taskId,
        string memory _title,
        string memory _description
    ) external taskExists(_taskId) onlyTaskOwner(_taskId) {
        require(bytes(_title).length > 0, "Title cannot be empty");

        Task storage task = tasks[_taskId];
        task.title = _title;
        task.description = _description;
        task.updatedAt = block.timestamp;

        emit TaskUpdated(_taskId, _title, task.status);
    }

    /**
     * @dev Change the status of a task
     * @param _taskId The ID of the task
     * @param _status The new status
     */
    function updateTaskStatus(
        uint256 _taskId,
        TaskStatus _status
    ) external taskExists(_taskId) onlyTaskOwner(_taskId) {
        Task storage task = tasks[_taskId];
        task.status = _status;
        task.updatedAt = block.timestamp;

        emit TaskStatusChanged(_taskId, _status);
    }

    /**
     * @dev Delete a task
     * @param _taskId The ID of the task to delete
     */
    function deleteTask(uint256 _taskId) external taskExists(_taskId) onlyTaskOwner(_taskId) {
        address owner = tasks[_taskId].owner;

        // Remove from user's task list
        uint256[] storage userTaskList = userTasks[owner];
        for (uint256 i = 0; i < userTaskList.length; i++) {
            if (userTaskList[i] == _taskId) {
                userTaskList[i] = userTaskList[userTaskList.length - 1];
                userTaskList.pop();
                break;
            }
        }

        delete tasks[_taskId];
        emit TaskDeleted(_taskId, owner);
    }

    /**
     * @dev Get a specific task
     * @param _taskId The ID of the task
     * @return Task struct containing all task details
     */
    function getTask(uint256 _taskId) external view taskExists(_taskId) returns (Task memory) {
        return tasks[_taskId];
    }

    /**
     * @dev Get all task IDs for a specific user
     * @param _user The address of the user
     * @return Array of task IDs owned by the user
     */
    function getUserTasks(address _user) external view returns (uint256[] memory) {
        return userTasks[_user];
    }

    /**
     * @dev Get all tasks for a specific user
     * @param _user The address of the user
     * @return Array of Task structs owned by the user
     */
    function getUserTaskDetails(address _user) external view returns (Task[] memory) {
        uint256[] memory taskIds = userTasks[_user];
        Task[] memory userTaskList = new Task[](taskIds.length);

        for (uint256 i = 0; i < taskIds.length; i++) {
            userTaskList[i] = tasks[taskIds[i]];
        }

        return userTaskList;
    }

    /**
     * @dev Get the total number of tasks created
     * @return The total task count
     */
    function getTotalTaskCount() external view returns (uint256) {
        return taskCounter;
    }

    /**
     * @dev Get the number of tasks for a specific user
     * @param _user The address of the user
     * @return The number of tasks owned by the user
     */
    function getUserTaskCount(address _user) external view returns (uint256) {
        return userTasks[_user].length;
    }
}
