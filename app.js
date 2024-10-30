const express = require("express");
const app = express();
const dotenv = require("dotenv");
const session = require("express-session");
const bcryptjs = require("bcryptjs");
const connection = require("./database/db");

dotenv.config({ path: "./env/.env" });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));
app.set("view engine", "ejs");
app.use('/public', express.static('public'));
app.use('/public/icon', express.static('icon'));

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/index", (req, res) => {
    res.render("index");
});

// Ruta para registrar
app.post('/register', async (req, res) => {
    const { username, password, correo, nombreCompleto } = req.body;
    console.log(req.body);

    // Crea la tabla si no existe
    connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            correo VARCHAR(255),
            nombreCompleto VARCHAR(255),
            password VARCHAR(255) NOT NULL
        )
    `, (error) => {
        if (error) {
            console.error("Error al crear la tabla users:", error);
            return res.status(500).send("Error en el servidor");
        }

        // Insertar usuario
        bcryptjs.hash(password, 8, (err, hashedPassword) => {
            if (err) {
                console.error('Error al encriptar la contraseña:', err);
                return res.status(500).send("Error al registrar el usuario");
            }
            const query = 'INSERT INTO users (username, password, correo, nombreCompleto) VALUES (?, ?, ?, ?)';
            connection.query(query, [username, hashedPassword, correo, nombreCompleto], (err, results) => {
                if (err) {
                    console.error('Error al registrar el usuario:', err);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }
                res.status(201).json({ message: 'Usuario registrado exitosamente' });
            });
        });
    });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        if (error || results.length == 0) {
            console.error("Error al buscar el usuario:", error);
            return res.status(401).send("Usuario o contraseña incorrectos");
        }

        const user = results[0];

        // Comparar la contraseña
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send("Usuario o contraseña incorrectos");
        }

        // Crear sesión para el usuario
        req.session.userId = user.id;
        res.send("Login exitoso");
    });
});

// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).send("Debes iniciar sesión para acceder a esta página");
}

// Usar el middleware en las rutas protegidas 
app.get('/api/tasks', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    connection.query("SELECT * FROM tarea WHERE user_id = ?", [userId], (error, results) => {
        if (error) {
            console.error("Error al obtener las tareas:", error);
            return res.status(500).send("Error al obtener las tareas");
        }
        res.json(results);
    });
});

// Ruta para agregar una nueva tarea
app.post('/api/tasks', (req, res) => {
    const userId = req.session.userId;
    const { name, completed } = req.body;

    connection.query(`
        CREATE TABLE IF NOT EXISTS tarea (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            tarea VARCHAR(255) NOT NULL,
            completado BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (error) => {
        if (error) {
            console.error("Error al verificar o crear la tabla tarea:", error);
            return res.status(500).send("Error al verificar o crear la tabla tarea");
        }

        // Si la tabla se verificó o se creó correctamente, procedemos a la inserción.
        connection.query(
            "INSERT INTO tarea (user_id, tarea, completado) VALUES (?, ?, ?)", 
            [userId, name, completed], 
            (error, results) => {
                if (error) {
                    console.error("Error al agregar la tarea:", error);
                    return res.status(500).send("Error al agregar la tarea");
                }
                res.status(201).send("Tarea agregada");
            }
        );
    });
});

// Ruta para actualizar una tarea
app.put('/api/tasks/:nombreTarea', (req, res) => {
    const nombreTareaAnterior = req.params.nombreTarea;
    const { name: nuevoNombreTarea, completed: completado } = req.body;

    const query = "UPDATE tarea SET tarea = ?, completado = ? WHERE tarea = ?";
    connection.query(query, [nuevoNombreTarea, completado, nombreTareaAnterior], (error, resultados) => {
        if (error) {
            console.error("Error al actualizar la tarea:", error);
            res.status(500).send("Error al actualizar la tarea en la base de datos");
        } else {
            res.send("Tarea actualizada correctamente");
        }
    });
});

// Ruta para eliminar una tarea
app.delete('/api/tasks/:name', (req, res) => {
    const userId = req.session.userId;
    const { name } = req.params;

    connection.query("DELETE FROM tarea WHERE user_id = ? AND tarea = ?", [userId, name], (error, results) => {
        if (error) {
            console.error("Error al eliminar la tarea:", error);
            return res.status(500).send("Error al eliminar la tarea");
        }
        res.send("Tarea eliminada");
    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});
