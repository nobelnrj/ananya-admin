import { getPermissionsArray } from "../requests/Permissions";
import { inviteStaffMember } from "../requests/StaffMembers";

export function inviteStaffMemberWithFirstPermission({
  email,
  isActive = true,
  firstName = "",
  lastName = ""
}) {
  return getPermissionsArray(1).then(permissions => {
    inviteStaffMember({
      firstName,
      lastName,
      email,
      isActive,
      permissionId: permissions[0].node.id
    });
  });
}

/**
 * Function mpGetMailsByRecipient first get all emails from mailpit with a timeout, and after that it finds email from recipient.
 * It cloud happened that invite email from saleor has not been received yet, so in this case the action should be retried.
 */
export function getMailActivationLinkForUser(email, i = 0) {
  if (i > 3) {
    throw new Error(`There is no email invitation for user ${email}`);
  }
  return cy.mpGetMailsByRecipient(email).then(mails => {
    if (!mails.length) {
      cy.wait(10000);
      getMailActivationLinkForUser(email, i + 1);
    } else {
      cy.wrap(mails)
        .mpLatest()
        .should("not.eq", undefined)
        .mpGetMailDetails()
        .its("Text")
        .then(body => {
          const urlRegex = /\[([^\]]*)\]/;
          const bodyWithoutWhiteSpaces = body.replace(/(\r\n|\n|\r|\s)/gm, "");
          return urlRegex.exec(bodyWithoutWhiteSpaces)[1];
        });
    }
  });
}

export function getMailActivationLinkForUserAndSubject(email, subject, i = 0) {
  if (i > 3) {
    throw new Error(`There is no email invitation for user ${email}`);
  }
  return cy.mpGetMailsByRecipient(email).then(mails => {
    if (!mails.length) {
      cy.wait(10000);
      getMailActivationLinkForUserAndSubject(email, subject, i + 1);
    } else {
      cy.wrap(mails)
        .mpGetMailsBySubject(subject)
        .then(mailsWithSubject => {
          if (!mailsWithSubject.length) {
            cy.wait(10000);
            getMailActivationLinkForUserAndSubject(email, subject, i + 1);
          } else {
            cy.wrap(mailsWithSubject)
              .mpLatest()
              .should("not.eq", undefined)
              .mpGetMailDetails()
              .its("Text")
              .then(body => {
                const urlRegex = /\[([^\]]*)\]/;
                const bodyWithoutWhiteSpaces = body.replace(
                  /(\r\n|\n|\r|\s)/gm,
                  ""
                );
                return urlRegex.exec(bodyWithoutWhiteSpaces)[1];
              });
          }
        });
    }
  });
}

export function getMailsForUser(email, i = 0) {
  if (i > 3) {
    throw new Error(`There is no email invitation for user ${email}`);
  }
  return cy.mpGetMailsByRecipient(email).then(mails => {
    if (!mails.length) {
      cy.wait(10000);
      getMailsForUser(email, i + 1);
    } else {
      return mails;
    }
  });
}
