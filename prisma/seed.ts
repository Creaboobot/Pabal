async function main() {
  console.log("No seed data is defined for the foundation scaffold.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
