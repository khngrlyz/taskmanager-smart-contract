const hre = require("hardhat");

async function main() {
  console.log("Deploying TaskManager contract...");

  // Get the contract factory
  const TaskManager = await hre.ethers.getContractFactory("TaskManager");

  // Deploy the contract
  const taskManager = await TaskManager.deploy();

  await taskManager.waitForDeployment();

  const address = await taskManager.getAddress();

  console.log(`TaskManager deployed to: ${address}`);
  console.log(`Transaction hash: ${taskManager.deploymentTransaction().hash}`);

  // Optionally create a sample task
  console.log("\nCreating a sample task...");
  const tx = await taskManager.createTask(
    "Welcome to TaskManager",
    "This is your first task on the blockchain!"
  );
  await tx.wait();
  console.log("Sample task created successfully!");

  const taskCount = await taskManager.getTotalTaskCount();
  console.log(`Total tasks: ${taskCount}`);

  console.log("\n✅ Deployment completed successfully!");
  console.log(`\nTo verify your contract on Etherscan (if deploying to a public network):`);
  console.log(`npx hardhat verify --network <network-name> ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
