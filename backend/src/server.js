import express from 'express';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import { NotFoundError } from './exceptions/AppError.js';
import { Messages } from './enums/Messages.js';

const app = express();

app.use(express.json());
app.use('/api', routes);

app.use((req, res, next) => {
    next(new NotFoundError(Messages.ROUTE_NOT_FOUND));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
