import { GoogleAuth } from "google-auth-library";
import { sheets } from "googleapis/build/src/apis/sheets/index.js";
import { logModel } from "../models/logs.models.js";
import "dotenv/config";

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
  const { row, state, closer, call } = request.body;

  console.log(call);
  const estados = [
    "En llamada",
    "Win",
    "Lose",
    "Contactado",
    "Esperando respuesta",
  ];

  if (!estados.includes(state)) {
    return response.status(400).send({
      status: "Error",
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

    await sheet.spreadsheets.values.update({
      spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
      range: `Hoja 1!J${row}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[call]],
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

    console.log(changes);

    response.status(200).send({ status: "Ok", changes });
  } catch (error) {
    response.status(400).send(error);
  }
};

export const updateByEmail = async (request, response) => {
  const { email } = request.params;
  const { state, call } = request.body;

  try {
    const { data } = await sheet.spreadsheets.values.get({
      spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
      range: "Hoja 1",
    });

    const values = await data.values;
    const index = values.findIndex((sheet) => sheet[1] === email);

    if (index !== -1) {
      await sheet.spreadsheets.values.update({
        spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
        range: `Hoja 1!I${index + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[state]],
        },
      });

      await sheet.spreadsheets.values.update({
        spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
        range: `Hoja 1!J${index + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[call]],
        },
      });
      return response.status(200).send({ status: "Ok", index });
    } else {
      return response.status(400).send({ status: "Error", msg: "Bad Request" });
    }
  } catch (error) {
    response.status(400).send(error);
  }
};

export const getByCloser = async (request, response) => {
  const { closer } = request.params;
  try {
    const { data } = await sheet.spreadsheets.values.get({
      spreadsheetId: "1gwk6Jzk06_Wa5LhsOgeV9Sz1VibT_E6HcqMW3YLrjEQ",
      range: "Hoja 1",
    });

    const values = await data.values;
    const leadsCloser = [];

    for (let i = 0; i < values.length; i++) {
      const [day, month, year] = values[i][0].split("/").join("-").split("-");

      if (year < 2024) {
        const [day, month, year] = values[i][0]
          .split("/")
          .join("-")
          .split("-")
          .reverse();
        values[i][0] = new Date(year, month - 1, day);
      } else {
        values[i][0] = new Date(year, month - 1, day);
      }

      for (let j = 0; j < values.length; j++) {
        if (values[i][j] === closer) {
          leadsCloser.push(values[i]);
        }
      }
    }

    leadsCloser.sort((a, b) => {
      const yearDiff = a[0].getFullYear() - b[0].getFullYear();
      if (yearDiff !== 0) return yearDiff;

      const monthDiff = a[0].getMonth() - b[0].getMonth();
      if (monthDiff !== 0) return monthDiff;

      return a[0].getDate() - b[0].getDate();
    });

    return response.status(200).send(leadsCloser);
  } catch (error) {
    console.log(error);
    response.status(400).send(error);
  }
};
