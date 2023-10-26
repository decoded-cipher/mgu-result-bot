require('dotenv').config()
const express = require('express')
const { spawn } = require('child_process');
const chalk = require('chalk');

const db = require('./config/db');
const data = require('./public/data/new_test.json');

const utils = require('./helpers/utils.js');
const process_ug = require('./helpers/process_UG.js');
const process_pg = require('./helpers/process_PG.js');
const cons_sheet = require('./helpers/cons_sheet_xlsx.js');
const obe_xlsx = require('./helpers/obe_sheet_xlsx.js');
const analytics = require('./helpers/analytics.js');

const app = express()

db.connect();


let exam_id = "90";
let programme = "B.Sc Geology Model I";
let title = "B.Sc Geology Degree (C.B.C.S) University Examination Results"


app.get('/', async (req, res) => {

    let processMode = null;
    let mode = req.query.mode;

    mode == "ug" ? processMode = process_ug : processMode = process_pg;

    if(!mode) {
        res.send({
            status: "error",
            message: "Please specify the mode of the exam. (ug/pg)"
        });
        return;
    } else if(mode != "ug" && mode != "pg") {
        res.send({
            status: "error",
            message: "Invalid mode specified. (ug/pg)"
        });
        return;
    } else {

        // await utils.fetchExamDetails();
        // console.log("--- -------------------- ---");

        // await utils.generatePDFs(data.students);
        // console.log("--- -------------------- ---");

        // await utils.sendOutEmails(data.students);
        // console.log("--- -------------------- ---");


        // await processMode.fetchAllResults(data.students, data.exam_id).then(async (fetch) => {
            await processMode.processAllResults(data.students, data.exam_id).then(async (process) => {


                // await cons_sheet.generate_XLSX(exam_id, programme, title).then(async (obe_sheet) => {
                //     await obe_xlsx.generate_XLSX(exam_id, programme, title).then(async (cons_sheet) => {
                        
                //         await analytics.generate_Tables_XLSX(cons_sheet.resultStats, exam_id, programme, title).then(async (tables) => {
                //             await analytics.fetch_Graphs(cons_sheet.resultStats, title).then(async (graphs) => {


                                res.send({
                                    // fetch: fetch,
                                    process: process,
                //                     obe_sheet: {
                //                         status: obe_sheet.status,
                //                         message: obe_sheet.message,
                //                     },
                //                     cons_sheet: {
                //                         status: cons_sheet.status,
                //                         message: cons_sheet.message,
                //                     },
                //                     overall: tables,
                //                     graphs: graphs,
                                });


                //             }).catch((err) => { res.send(err); })
                //         }).catch((err) => { res.send(err); });

                //     }).catch((err) => { res.send(err); });
                // }).catch((err) => { res.send(err); });


            }).catch((err) => { res.send(err); });
        // }).catch((err) => { res.send(err); });

    }
})







app.get('/test', async (req, res) => {

    var dataToSend;

    // spawn new child process to call the python script
    const python = spawn('python', ['./helpers/xlsx_pdf.py']);

    // collect data from script
    python.stdout.on('data', (data) => {
        console.log('Pipe data from python script ...');
        dataToSend = data.toString();
    });

    // in close event we are sure that stream from child process is closed
    python.on('close', (code) => {
        console.log(`child process close all stdio with code ${code}`);
        // send data to browser
        res.send(dataToSend)
    });

});








app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`)
})