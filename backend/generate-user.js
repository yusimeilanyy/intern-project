// generate-user.js (Versi ES Module)
import bcrypt from "bcrypt"; // ← Ganti require jadi import

async function createHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("---");
}

createHash("admin123");
createHash("mahasiswa123");