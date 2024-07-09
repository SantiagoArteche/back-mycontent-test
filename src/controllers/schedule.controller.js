import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";
import { sheets } from "googleapis/build/src/apis/sheets/index.js";
import { logModel } from "../models/logs.models.js";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  },
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const sheet = sheets({
  version: "v4",
  auth,
});

export const getGoogleSheet = async (request, response) => {
  try {
    const res = await sheet.spreadsheets.values.get({
      spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
      range: "Hoja 1",
    });

    response.status(200).send(res.data.values);
  } catch (error) {
    console.error("Error en API", error);
    response.status(400).send(error);
  }
};

export const updateGoogleSheet = async (request, response) => {
  const { row, state, closer } = request.body;

  const estados = [
    "En llamada",
    "Win",
    "Lose",
    "Contactado",
    "Esperando respuesta",
  ];

  if (!estados.includes(state)) {
    return response.status(400).send({
      status: "Ok",
      msg: "Los estados posibles solo pueden ser " + `[${estados}]`,
    });
  }

  try {
    const [
      {
        data: { values: valuesCloser },
      },
      {
        data: { values: valuesEmail },
      },
    ] = await Promise.all([
      sheet.spreadsheets.values.get({
        spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
        range: `Hoja 1!H${row}`,
      }),
      sheet.spreadsheets.values.get({
        spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
        range: `Hoja 1!B${row}`,
      }),
    ]);

    if (valuesCloser[0][0] !== closer) {
      return response.status(400).send({
        status: "Error",
        msg: `${
          closer === "rodri" ? "Rodri" : "Juanjo"
        } no debes actualizar los estados de ${
          closer === "rodri" ? "Juanjo" : "Rodri"
        }!`,
      });
    }

    const email = valuesEmail[0][0];

    await sheet.spreadsheets.values.update({
      spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
      range: `Hoja 1!I${row}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[state]],
      },
    });

    const msg = `Estado de la fila ${row} correspondiente al email ${email} actualizado`;

    await changesRegister(msg);

    response.status(200).send({ status: "Ok", msg });
  } catch (error) {
    console.error("Error en API", error);
    response.status(400).send(error);
  }
};

const changesRegister = async (change) => {
  try {
    const newChange = await logModel.create({
      message: change,
      date: Date.now(),
    });
    newChange.save();

    return newChange;
  } catch (error) {
    console.error(error);
  }
};

export const getChanges = async (request, response) => {
  try {
    const changes = await logModel.find();

    response.status(200).send({ status: "Ok", changes });
  } catch (error) {
    response.status(400).send(error);
  }
};
