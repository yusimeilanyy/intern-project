// Tambahkan kolom role di sini
const User = sequelize.define('User', {
  // ... kolom lainnya
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'admin']]
    }
  }
});