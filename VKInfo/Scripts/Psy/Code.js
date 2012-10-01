function ComparePsy(psy1, psy2) {
    k = 1.1
    ymin = 3;
    if (psy1 + psy2 < ymin)
        return undefined;
    if (psy2 > psy1 * k + ymin)
        return 1;
    if (psy1 > psy2 * (1.0 / k) + ymin)
        return -1;
    return 0;
}

function Alert(f1, f2) {
    console.log(f1)
    console.log(f2)
}


function getDescription(text, callback) {
    /*
    si  sensor-intuit
    le  logic-etic
    ei  extra-intra
    ri  racional-irracional
    */
    psy = []
    $.ajax({
        url: "/Like/TextAnalisysForGroupText?groupTextName=sensor-intuit&text=" + text,
        success: function (dataSI) {
            compareResult = ComparePsy(dataSI[0].sensor, dataSI[0].intuit)
            if (compareResult == -1) {
                psy.push("сенсор")
                result = $.grep(result, function (el) {
                    return el.type[0] === 's'
                });
            }
            if (compareResult == 1) {
                psy.push("интуит")
                result = $.grep(result, function (el) {
                    return el.type[0] === 'i'
                });
            }
            $.ajax({
                url: "/Like/TextAnalisysForGroupText?groupTextName=logic-etic&text=" + text,
                success: function (dataLE) {
                    compareResult = ComparePsy(dataLE[0].logic, dataLE[0].etic)
                    if (compareResult == -1) {
                        psy.push("логик")
                        result = $.grep(result, function (el) {
                            return el.type[1] === 'l'
                        });
                    }
                    if (compareResult == 1) {
                        psy.push("этик")
                        result = $.grep(result, function (el) {
                            return el.type[1] === 'e'
                        });
                    }
                    $.ajax({
                        url: "/Like/TextAnalisysForGroupText?groupTextName=extra-intra&text=" + text,
                        success: function (dataEI) {
                            compareResult = ComparePsy(dataEI[0].extra, dataEI[0].intra)
                            if (compareResult == -1) {
                                psy.push("экстраверт")
                                result = $.grep(result, function (el) {
                                    return el.type[2] === 'e'
                                });
                            }
                            if (compareResult == 1) {
                                psy.push("интраверт")
                                result = $.grep(result, function (el) {
                                    return el.type[2] === 'i'
                                });
                            }
                            $.ajax({
                                url: "/Like/TextAnalisysForGroupText?groupTextName=racional-irracional&text=" + text,
                                success: function (dataRI) {
                                    compareResult = ComparePsy(dataRI[0].racional, dataRI[0].irracional)
                                    if (compareResult == -1) {
                                        psy.push("рационал")
                                        result = $.grep(result, function (el) {
                                            return el.type[3] === 'r'
                                        });
                                    }
                                    if (compareResult == 1) {
                                        psy.push("иррационал")
                                        result = $.grep(result, function (el) {
                                            return el.type[3] === 'i'
                                        });
                                    }
                                    callback(result, psy)
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}