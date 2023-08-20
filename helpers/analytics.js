const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { getDataByDept } = require('./database');

const data = require('../public/xlsx/data.json');


module.exports = {


    generate_XLSX : async () => {
        return new Promise(async (resolve, reject) => {

            // await getDataByDept().then(async (data) => {

                let failedArray = {
                    index : [],
                }

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Results');

                worksheet.properties.defaultRowHeight = 25;
                worksheet.properties.defaultColWidth = 9;

                worksheet.getColumn('A').width = 20;
                worksheet.getColumn('B').width = 30;
        
                worksheet.mergeCells('A4:A5');
                worksheet.mergeCells('B4:B5');


                
                // Populate the XLSX file with data, column wise
                await module.exports.getDataAsArray(data, failedArray).then((response) => {

                    worksheet.getColumn('A').values = [null, null, null, null, "Register Number", ...response.results.prn];
                    worksheet.getColumn('B').values = [null, null, null, null, "Name", ...response.results.names];

                    // Subject wise marks and grades
                    for(let i = 0; i <= response.results.subjects.length; i++) {

                        let cell_11 = String.fromCharCode(67 + (i * 2)) + "4";
                        let cell_12 = String.fromCharCode(68 + (i * 2)) + "4";

                        // If the loop is at the last iteration (<=), then its the overall section
                        // Else, add the subject wise marks and grades
                        if(i == response.results.subjects.length) {

                            cell_12 = String.fromCharCode(70 + (i * 2)) + "4";
                            worksheet.mergeCells(cell_11 + ":" + cell_12);

                            worksheet.getColumn(String.fromCharCode(67 + (i * 2))).values = [null, null, null, null, "Marks", ...response.results.overall.marks];
                            worksheet.getColumn(String.fromCharCode(68 + (i * 2))).values = [null, null, null, null, "CP", ...response.results.overall.cp];
                            worksheet.getColumn(String.fromCharCode(69 + (i * 2))).values = [null, null, null, null, "Grade", ...response.results.overall.grade];
                            worksheet.getColumn(String.fromCharCode(70 + (i * 2))).values = [null, null, null, "Overall", "SGPA", ...response.results.overall.sgpa];
                        
                        } else {
                            worksheet.mergeCells(cell_11 + ":" + cell_12);
                            worksheet.getColumn(String.fromCharCode(67 + (i * 2))).values = [null, null, null, null, "Marks", ...response.results.subjects[i].marks];
                            worksheet.getColumn(String.fromCharCode(68 + (i * 2))).values = [null, null, null, response.subjectList[i], "Grade", ...response.results.subjects[i].grade];

                        }

                    }

                });



                // Styling the XLSX file (fonts, borders, alignment, etc.)
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {

                        if(colNumber == 2 && rowNumber > 5) {
                            cell.alignment = {
                                wrapText: true,
                                vertical: 'middle',
                                horizontal: 'left',
                                indent: 1,
                            }
                        } else {
                            cell.alignment = {
                                wrapText: true,
                                vertical: 'middle',
                                horizontal: 'center'
                            }
                        }

                        cell.border = {
                            top: { style:'thin' },
                            left: { style:'thin' },
                            bottom: { style:'thin' },
                            right: { style:'thin' }
                        },

                        cell.font = {
                            name: 'Times New Roman',
                            size: 11,
                        }

                    });

                    if(rowNumber == 4) {
                        row.height = 75;
                    } else {
                        row.height = 25;
                    }

                    // if rowNumber exists in failedArray, then highlight the row
                    if(failedArray.index.includes(rowNumber - 6)) {
                        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFABF8F' },
                                bgColor: { argb: 'FFFABF8F' }
                            }
                        });
                    }

                });



                // Write data to XLSX file
                await workbook.xlsx.writeFile(path.join(__dirname, '../public/xlsx/IEDC_Analytics.xlsx')).then(() => {
                    console.log("XLSX file generated");
                    resolve({
                        status: "success",
                        message: "XLSX file generated",
                    });
                });


                
            // }).catch((err) => {
            //     console.log("--- [analytics] --- Error in fetching data from database: " + err);
            //     reject({
            //         status: "error",
            //         message: "Error in fetching data from database: " + err,
            //     });
            // });

        });
    },


    
    // Convert data to array, so that it can be used in XLSX
    getDataAsArray : async (data, failedArray) => {
        return new Promise(async (resolve, reject) => {

            // Get the subject list
            let subjectList = [];
            for(let i = 0; i < data[0].data.result.subjects.length; i++) {
                subjectList.push(data[0].data.result.subjects[i].course);
            }

            let results = {
                prn : [],
                names : [],
                subjects : [],
                overall : {
                    marks : [],
                    cp : [],
                    grade : [],
                    sgpa : [],
                }
            };

            // Get the overall marks and grades
            for(let i = 0; i < data.length; i++) {
                
                results.prn.push(data[i].data.prn);
                results.names.push(data[i].data.name);

                let markHolder = data[i].data.result.total;
                let cpHolder = data[i].data.result.credit_points;
                let gradeHolder = data[i].data.result.grade;
                let sgpaHolder = data[i].data.result.scpa;

                if(markHolder === null) {
                    failedArray.index.push(i);
                }

                // Handling null values in the data with "-" and "F"
                markHolder === null ? markHolder = "-" : markHolder = markHolder;
                cpHolder === null ? cpHolder = "-" : cpHolder = cpHolder;
                gradeHolder === null ? gradeHolder = "F" : gradeHolder = gradeHolder;
                sgpaHolder === null ? sgpaHolder = "-" : sgpaHolder = sgpaHolder;

                results.overall.marks.push(markHolder);
                results.overall.cp.push(cpHolder);
                results.overall.grade.push(gradeHolder);
                results.overall.sgpa.push(sgpaHolder);

            }

            // Get the subject wise marks and grades
            for(let i = 0; i < data[0].data.result.subjects.length; i++) {
                
                let subject = {
                    marks : [],
                    grade : [],
                };

                for(let j = 0; j < data.length; j++) {

                    let markHolder = data[j].data.result.subjects[i].total;
                    let gradeHolder = data[j].data.result.subjects[i].grade;

                    // Handling null values in the data with "-" and "F"
                    markHolder === null ? markHolder = "-" : markHolder = markHolder;
                    gradeHolder === null ? gradeHolder = "F" : gradeHolder = gradeHolder;

                    subject.marks.push(markHolder);
                    subject.grade.push(gradeHolder);

                }

                results.subjects.push(subject);

            }

            resolve({
                results : results,
                subjectList : subjectList,
            });

        });
    },

};


