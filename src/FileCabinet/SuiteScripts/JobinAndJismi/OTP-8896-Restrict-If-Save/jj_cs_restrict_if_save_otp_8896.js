/**
 * @NApiVersion 2.x
 * 
 * @NScriptType ClientScript
 * 
 * @NModuleScope SameAccount
 */
/************************************************************************************* 
 ********* 
 * 
 * OTP-8896 : Restrict IF Save
 * 
 *************************************************************************************
 **********
 *
 * Author : Jobin and Jismi IT Services
 * 
 * Date Created : 20-Jun-2025
 * 
 * Description : This script is defined to restrict Item Fulfillment Save based on a
 *               condition. If Customer Deposit attached to the Sales Order is greater
 *               than the Sales Order total, Then Save the Item Fulfillment. Otherwise,
 *               Restrict the Item Fulfillment.
 * 
 * REVISION HISTORY
 * 
 * @version 1.0 20-Jun-2025 : Created the initial build by JJ0400
 * 
 * 
***************************************************************************************
***********/

define(["N/log", "N/record", "N/search"], /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */ function (log, record, search) {
  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {

    if (scriptContext.currentRecord) {

      try{

        let currentRec = scriptContext.currentRecord;

        let fulfillStatus = restrictFulfillment(currentRec);

        if (fulfillStatus) {

          return true;

        }

      } catch(error) {
        log.error('error' , error.message);
      }

    }

  }

  /**
   * 
   * Defines the function to execute for restricting item fulfillment
   * 
   * @param {Record} newRec - Record that need to be fulfilled.
   * @returns {boolean} Return true if record is valid
   * 
   */

  function restrictFulfillment(newRec) {

    try {

      let orderId = newRec.getValue("createdfrom");

      let statusLookUp = search.lookupFields({
        type: record.Type.SALES_ORDER,
        id: orderId,
        columns: ["status", "applyingtransaction", "fxamount"],
      });

      if (statusLookUp.status[0].value === "pendingFulfillment") {

        if (statusLookUp.applyingtransaction) {

          let depositSearch = search.create({
            id: "customsearch_jj_deposit_search",
            title: "Deposit Search JJ",
            type: record.Type.CUSTOMER_DEPOSIT,
            filters: [["salesorder", "is", orderId]],
            columns: [
              search.createColumn({ name: "entity", label: "Name" }),
              search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
            ],
          });

          let depositAmount = 0;

          depositSearch.run().each(function (result) {
            depositAmount += Number(result.getValue("fxamount"));
            return true;
          });

          let totalAmt = statusLookUp.fxamount;

          if (totalAmt <= depositAmount) {
            return true;
          } 

          else {
            alert('Insufficient Customer Deposit! Please add Balance & Try again...');
          }

        }
      
      }

    } catch (error) {
      log.error("error", error.message);
    }
  }

  return {
    saveRecord: saveRecord,
  };
});
