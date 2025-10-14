# TaskManager Smart Contract

A decentralized task management system built with Solidity that allows users to create, manage, and track their tasks on the blockchain.

## Overview

TaskManager is a smart contract that demonstrates core Solidity concepts including:
- **Structs & Enums**: Organized data structures for tasks and statuses
- **Mappings**: Efficient storage of tasks and user-task relationships
- **Events**: Real-time notifications for task operations
- **Modifiers**: Access control and validation
- **Arrays**: Dynamic task lists per user

## Features

- **Create Tasks**: Add new tasks with title and description
- **Update Tasks**: Modify task details and status
- **Delete Tasks**: Remove tasks from the blockchain
- **Task Status Management**: Track tasks through different states (Pending, In Progress, Completed, Cancelled)
- **User-specific Tasks**: Each user maintains their own task list
- **Access Control**: Only task owners can modify or delete their tasks
- **Event Logging**: All operations emit events for off-chain tracking

## Smart Contract Details

### Task Structure

```solidity
struct Task {
    uint256 id;
    string title;
    string description;
    TaskStatus status;
    uint256 createdAt;
    uint256 updatedAt;
    address owner;
}
```

### Task Status

```solidity
enum TaskStatus {
    Pending,      // 0
    InProgress,   // 1
    Completed,    // 2
    Cancelled     // 3
}
```

### Main Functions

- `createTask(string title, string description)` - Create a new task
- `updateTask(uint256 taskId, string title, string description)` - Update task details
- `updateTaskStatus(uint256 taskId, TaskStatus status)` - Change task status
- `deleteTask(uint256 taskId)` - Delete a task
- `getTask(uint256 taskId)` - Retrieve a specific task
- `getUserTasks(address user)` - Get all task IDs for a user
- `getUserTaskDetails(address user)` - Get complete task details for a user
- `getTotalTaskCount()` - Get total number of tasks created
- `getUserTaskCount(address user)` - Get number of tasks for a specific user

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd solidity-project
```

2. Install dependencies:
```bash
npm install
```

### Running Tests

Run the comprehensive test suite:

```bash
npx hardhat test
```

For detailed test output with gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

### Compilation

Compile the smart contracts:

```bash
npx hardhat compile
```

### Deployment

#### Deploy to Local Hardhat Network

1. Start a local Hardhat node:
```bash
npx hardhat node
```

2. In a new terminal, deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

#### Deploy to Public Testnet (e.g., Sepolia)

1. Update `hardhat.config.js` with your network configuration:

```javascript
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: ["YOUR-PRIVATE-KEY"]
    }
  }
};
```

2. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Usage Example

### Interacting with the Contract (Hardhat Console)

```bash
npx hardhat console --network localhost
```

Then in the console:

```javascript
// Get the contract
const TaskManager = await ethers.getContractFactory("TaskManager");
const taskManager = await TaskManager.attach("CONTRACT_ADDRESS");

// Create a task
await taskManager.createTask("Complete README", "Write comprehensive documentation");

// Get your tasks
const [owner] = await ethers.getSigners();
const tasks = await taskManager.getUserTaskDetails(owner.address);
console.log(tasks);

// Update task status
await taskManager.updateTaskStatus(1, 1); // Set to InProgress

// Complete the task
await taskManager.updateTaskStatus(1, 2); // Set to Completed
```

### Interacting with Ethers.js in a Frontend

```javascript
import { ethers } from 'ethers';

// Connect to the contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const taskManager = new ethers.Contract(contractAddress, abi, signer);

// Create a task
const tx = await taskManager.createTask(
  "Buy groceries",
  "Milk, eggs, bread"
);
await tx.wait();

// Listen for TaskCreated events
taskManager.on("TaskCreated", (taskId, owner, title) => {
  console.log(`New task created: ${title} (ID: ${taskId})`);
});

// Get all user tasks
const tasks = await taskManager.getUserTaskDetails(await signer.getAddress());
```

## Project Structure

```
solidity-project/
├── contracts/
│   └── TaskManager.sol          # Main smart contract
├── scripts/
│   └── deploy.js                # Deployment script
├── test/
│   └── TaskManager.test.js      # Comprehensive test suite
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Testing Coverage

The test suite covers:
- Contract deployment
- Task creation (single and multiple users)
- Task retrieval (individual and batch)
- Task updates and status changes
- Task deletion
- Access control (owner-only operations)
- Input validation (empty titles, etc.)
- Complex scenarios (full lifecycle)
- Edge cases and error handling

Run tests with coverage:
```bash
npx hardhat coverage
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `memory` for function parameters and return values
- Efficient array operations for task deletion
- Minimal storage operations
- Event emissions for off-chain indexing

## Security Considerations

- **Access Control**: Only task owners can modify or delete their tasks
- **Input Validation**: Titles cannot be empty
- **Existence Checks**: Tasks must exist before operations
- **Timestamp Usage**: Uses `block.timestamp` for creation and update times
- **No Reentrancy**: No external calls that could lead to reentrancy attacks

## Future Enhancements

Potential features for future versions:
- Task assignment to other addresses
- Task priority levels
- Due dates with automatic status changes
- Task categories/tags
- Collaborative tasks with multiple owners
- Task rewards/incentives using tokens

## Development

### Run Local Blockchain

```bash
npx hardhat node
```

### Clean Build Artifacts

```bash
npx hardhat clean
```

### Flatten Contract (for verification)

```bash
npx hardhat flatten contracts/TaskManager.sol > TaskManagerFlattened.sol
```

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
