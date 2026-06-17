import React from 'react';

const DPDPACompliance: React.FC = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '60px auto', padding: '40px 20px', fontFamily: "var(--sans, 'DM Sans', sans-serif)", lineHeight: 1.6, color: '#333' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px', color: '#0B2D5E', textAlign: 'center' }}>
        Final DPDP Rules 2025 – Ministry of Electronics and Information Technology
      </h1>
      
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: '#0B2D5E' }}>Overview of Final DPDP Rules 2025</h2>
        <p style={{ marginBottom: '12px' }}>
          G.S.R. 846(E).- Whereas draft of the Digital Personal Data Protection Rules, 2025 were published, as required under sub-section (1) of section 40 of the of the Digital Personal Data Protection Act, 2023 (22 of 2023), vide notification of the Government of India in the Ministry of Electronics and Information Technology vide number G.S.R. 02 (E), dated the 3rd January, 2025, in the Gazette of India, Extraordinary, Part II, Section 3, Sub-section (i), dated the 3rd January, 2025, inviting objections and suggestions from all persons likely to be affected thereby, before the expiry of the period of forty-five days from the date on which copies of the Official Gazette containing the said notification were made available to public;
        </p>
        <p style={{ marginBottom: '12px' }}>
          And whereas copies of the said Official Gazette were made available to the public on the 3rd January, 2025;
        </p>
        <p style={{ marginBottom: '12px' }}>
          And whereas objections and suggestions were received from the public in respect of the said draft rules have been considered by the Central Government;
        </p>
        <p style={{ marginBottom: '12px' }}>
          Now, therefore in exercise of powers conferred by sub-sections (1) and (2) of section 40 of the Digital Personal Data Protection Act, 2023 (22 of 2023), the Central Government hereby makes the following rules, namely: —
        </p>
      </section>

      <section style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#0B2D5E' }}>How to Submit Objections or Suggestions</h3>
        <p style={{ marginBottom: '16px' }}>
          Objections and suggestions, if any, may be submitted on the official website of MyGov (https://mygov.in) by the said date;
        </p>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#0B2D5E' }}>Submission Handling and Data Privacy</h3>
        <p style={{ marginBottom: '12px' }}>
          The objections and suggestions, which may be received from any person with respect to the said draft rules before the expiry of the period specified above, shall not be attributed to the persons submitting publicly and shall be held in fiduciary capacity to enable them to provide the same freely, and shall be considered by the Central Government.
        </p>
        <p style={{ fontStyle: 'italic', color: '#555' }}>
          For more details on the Digital Personal Data Protection Act 2023, visit our detail.
        </p>
      </section>

      {/* Rules list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Rule 1 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 1: Short title and commencement</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>These rules may be called the Digital Personal Data Protection Rules, 2025.</li>
            <li>Rules 1, 2 and 17 to 21 shall come into force on the date of their publication in the Official Gazette.</li>
            <li>Rule 4 shall come into force one year after the date of publication of this Gazette.</li>
            <li>Rules 3, 5 to 16, 22 and 23 shall come into force eighteen months after the date of publication of this Gazette.</li>
          </ol>
        </div>

        {/* Rule 2 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 2: Definitions</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>
              In these rules, unless the context otherwise requires, –
              <ul style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>“Act” means the Digital Personal Data Protection Act, 2023 (22 of 2023);</li>
                <li>“techno-legal measures” means as referred to under rules 20 and 22;</li>
                <li>“user account” means the online account registered by the Data Principal with the Data Fiduciary, and includes any profiles, pages, handles, email address, mobile number and other similar presences by means of which such Data Principal is able to access the services of such Data Fiduciary</li>
                <li>“verifiable consent” means a consent as specified in rule 10 or 11.</li>
              </ul>
            </li>
            <li>The words and expressions used in these rules and not defined, but defined in the Act, shall have the same meanings respectively assigned to them in the Act.</li>
          </ol>
        </div>

        {/* Rule 3 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 3: Notice given by Data Fiduciary to Data Principal</h2>
          <p style={{ marginBottom: '8px' }}>The notice given by the Data Fiduciary to the Data Principal shall—</p>
          <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '24px', marginBottom: '0' }}>
            <li>be presented and be understandable independently of any other information that has been, is or may be made available by such Data Fiduciary;</li>
            <li>give, in clear and plain language, a fair account of the details necessary to enable the Data Principal to give specific and informed consent for the processing of her personal data, which shall include, at the minimum, —
              <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                <li>an itemised description of such personal data; and</li>
                <li>the specified purpose or purposes of, and specific description of the goods or services to be provided or uses to be enabled by, such processing; and</li>
              </ol>
            </li>
            <li>give, the particular communication link for accessing the website or app, or both, of such Data Fiduciary, and a description of other means, if any, using which such Data Principal may—
              <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                <li>withdraw her consent, with the ease of doing so being comparable to that with which such consent was given;</li>
                <li>exercise her rights under the Act; and</li>
                <li>make a complaint to the Board.</li>
              </ol>
            </li>
          </ol>
        </div>

        {/* Rule 4 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 4: Registration and obligations of Consent Manager</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>A person who fulfils the conditions for registration of Consent Managers set out in Part A of First Schedule may apply to the Board for registration as a Consent Manager by furnishing such particulars and such other information and documents as the Board may publish in this behalf on its website.</li>
            <li>On receipt of such application, the Board may make such inquiry as it may deem fit to satisfy itself regarding fulfilment of the conditions set out in Part A of First Schedule, and if it—
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>is satisfied, register the applicant as a Consent Manager, under intimation to the applicant, and publish on its website the particulars of such Consent Manager; or</li>
                <li>is not satisfied, reject the application and communicate the reasons for the rejection to the applicant.</li>
              </ol>
            </li>
            <li>The Consent Manager shall have obligations as specified in Part B of First Schedule.</li>
            <li>If the Board is of the opinion that a Consent Manager is not adhering to the conditions and obligations under this rule,it may, after giving an opportunity of being heard, inform the Consent Manager of such nonadherence and direct the Consent Manager to take measures to ensure adherence.</li>
            <li>The Board may, if it is satisfied that it is necessary so to do in the interests of Data Principals, after giving the Consent Manager an opportunity of being heard, by order, for reasons to be recorded in writing, —
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>suspend or cancel the registration of such Consent Manager; and</li>
                <li>give such directions as it may deem fit to that Consent Manager, to protect the interests of the Data Principals.</li>
              </ol>
            </li>
            <li>The Board may, for the purposes of this rule, require the Consent Manager to furnish such information as the Board may call for.</li>
          </ol>
        </div>

        {/* Rule 5 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 5: Processing of personal data for provision or issue of subsidy, benefit, service, certificate, licence or permit by State and its instrumentalities</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>Processing the personal data of a Data Principal under this rule shall be done following the standards specified in Second Schedule.</li>
            <li>In this rule and the Second Schedule, the reference to any subsidy, benefit, service, certificate, licence or permit that is provided or issued—
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>under law shall be construed as a reference to provision or issuance of such subsidy, benefit, service, certificate, licence or permit in exercise of any power of or the performance of any function by the State or any of its instrumentalities under any law for the time being in force;</li>
                <li>under policy shall be construed as a reference to provision or issuance of such subsidy, benefit, service, certificate, licence or permit under any policy or instruction issued by the Central Government or a State Government in exercise of its executive power; and</li>
                <li>using public funds shall be construed as a reference to provision or issuance of such subsidy, benefit, service, certificate, licence or permit by incurring expenditure on the same from, or with accrual of receipts to, —
                  <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                    <li>in case of the Central Government or a State Government, the Consolidated Fund of India or the Consolidated Fund of the State or the public account of India or the public account of the State; or</li>
                    <li>in case of any local or other authority within the territory of India or under the control of the Government of India or of any State, the fund or funds of such authority.</li>
                  </ol>
                </li>
              </ol>
            </li>
          </ol>
        </div>

        {/* Rule 6 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 6: Reasonable security safeguards</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>A Data Fiduciary shall protect personal data in its possession or under its control, including in respect of any processing undertaken by it or on its behalf by a Data Processor, by taking reasonable security safeguards to prevent personal data breach, which shall include, at the minimum, —
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>appropriate data security measures, such as securing of personal data through encryption, obfuscation, masking or the use of virtual tokens mapped to that personal data;</li>
                <li>appropriate measures to control access to the computer resources used by such Data Fiduciary or such a Data Processor, wherever applicable;</li>
                <li>visibility on the accessing of such personal data, through appropriate logs, monitoring and review, for enabling detection of unauthorised access, its investigation and remediation to prevent recurrence;</li>
                <li>reasonable measures for continued processing in the event of confidentiality, integrity or availability of such personal data being compromised as a result of destruction or loss of access to personal data or otherwise, such as by way of data-backups;</li>
                <li>for enabling the detection of unauthorised access, its investigation, remediation to prevent recurrence and continued processing in the event of such a compromise, retain such logs and personal data for a period of one year, unless compliance with any law for the time being in force requires otherwise;</li>
                <li>appropriate provision in the contract entered into between such Data Fiduciary and such a Data Processor, wherever applicable, for taking reasonable security safeguards; and</li>
                <li>appropriate technical and organisational measures to ensure effective observance of security safeguards.</li>
              </ol>
            </li>
            <li>In this rule, the expression “computer resource” shall have the same meaning as is assigned to it in Information Technology Act, 2000 (21 of 2000).</li>
          </ol>
        </div>

        {/* Rule 7 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 7: Intimation of personal data breach</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>On becoming aware of any personal data breach, the Data Fiduciary shall, to the best of its knowledge, intimate to each affected Data Principal, in a concise, clear and plain manner and without delay, through her user account or any mode of communication registered by her with the Data Fiduciary, —
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>a description of the breach, including its nature, extent and the timing of its occurrence;</li>
                <li>the consequences relevant to her, that are likely to arise from the breach;</li>
                <li>the measures implemented and being implemented by the Data Fiduciary, if any, to mitigate risk;</li>
                <li>the safety measures that she may take to protect her interests; and</li>
                <li>business contact information of a person who is able to respond on behalf of the Data Fiduciary, to queries, if any, of the Data Principal.</li>
              </ol>
            </li>
            <li>On becoming aware of any personal data breach, the Data Fiduciary shall intimate to the Board, —
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>without delay, a description of the breach, including its nature, extent, timing and location of occurrence and the likely impact;</li>
                <li>within seventy-two hours of becoming aware of the breach, or within such longer period as the Board may allow on a request made in writing in this behalf, —
                  <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                    <li>updated and detailed information in respect of such description;</li>
                    <li>the broad facts related to the events, circumstances and reasons leading to the breach;</li>
                    <li>measures implemented or proposed, if any, to mitigate risk;</li>
                    <li>any findings regarding the person who caused the breach;</li>
                    <li>remedial measures taken to prevent recurrence of such breach; and</li>
                    <li>a report regarding the intimations given to affected Data Principals.</li>
                  </ol>
                </li>
              </ol>
            </li>
          </ol>
        </div>

        {/* Rule 8 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 8: Time period for specified purpose to be deemed as no longer being served</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>A Data Fiduciary, who is of such class and is processing personal data for such corresponding purposes as are specified in Third Schedule, shall erase such personal data, unless its retention is necessary for compliance with any law for the time being in force, or, for the corresponding time period specified in the Third Schedule, if the Data Principal neither approaches such Data Fiduciary for the performance of the specified purpose nor exercises her rights in relation to such processing.</li>
            <li>At least forty-eight hours before completion of the time period for erasure of personal data under this rule, the Data Fiduciary shall inform the Data Principal that such personal data shall be erased upon completion of such period, unless she logs into her user account or otherwise initiates contact with the Data Fiduciary for the performance of the specified purpose or exercises her rights in relation to the processing of such personal data.</li>
            <li>Without prejudice to sub-rules (1) and (2), a Data Fiduciary shall retain, in respect of any processing of personal data undertaken by it or on its behalf by a Data Processor, such personal data, associated traffic data and other logs of the processing for a minimum period of one year from the date of such processing, for the purposes as specified in the Seventh Schedule, after which the Data Fiduciary shall cause such personal data and logs to be erased, unless further retention is required for compliance with any other law for the time being in force or notified by the Government.</li>
          </ol>
          <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#e9f2fb', borderRadius: '8px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Illustration</h4>
            <p style={{ marginBottom: '8px' }}><strong>Case 1:</strong> X, a Data Principal purchases an e-book on an e-book platform Y. Once delivery is completed, the specified purpose of processing is served. The platform Y must retain the order details, personal data, and logs of the processing (such as order confirmation, payment, and delivery events) for at least one year from the date of the transaction, even if X deletes her account.</p>
            <p style={{ marginBottom: '0' }}><strong>Case 2:</strong> X, a company engages a cloud service provider C as its Data Processor to host customer records. X as the Data Fiduciary, is required to ensure that the C also retains the data and associated logs for at least one year before erasure, unless any other applicable law requires a longer period.</p>
          </div>
        </div>

        {/* Rule 9 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 9: Contact information of person to answer questions about processing</h2>
          <p>Every Data Fiduciary shall prominently publish on its website or app, and mention in every response to a communication for the exercise of the rights of a Data Principal under the Act, the business contact information of the Data Protection Officer, if applicable, or a person who is able to answer on behalf of the Data Fiduciary the questions of the Data Principal about the processing of her personal data.</p>
        </div>

        {/* Rule 10 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 10: Verifiable consent for processing of personal data of child</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>A Data Fiduciary shall adopt appropriate technical and organisational measures to ensure that verifiable consent of the parent is obtained before the processing of any personal data of a child and shall observe due diligence, for checking that the individual identifying herself as the parent is an adult who is identifiable if required in connection with compliance with any law for the time being in force in India, by reference to—
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>reliable details of identity and age of the individual available with the Data Fiduciary; or</li>
                <li>details of identity and age, voluntarily provided —
                  <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                    <li>by the individual; or</li>
                    <li>through a virtual token mapped to such details, which is issued by an authorised entity</li>
                  </ol>
                </li>
              </ol>
            </li>
            <li>In this rule, the expression—
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>an entity entrusted by law or by the Central Government or by the State Government with the issuance of details of the identity and age or a virtual token mapped to such details; or</li>
                <li>an entity entrusted by law or by the Central Government or by the State Government with the issuance of details of the identity and age or a virtual token mapped to such details; or</li>
                <li>“Digital Locker service provider” shall mean such intermediary, including a body corporate or an agency of the appropriate Government, as may be notified by the Central Government, in accordance with the rules made in this regard under the Information Technology Act, 2000 (21 of 2000)</li>
              </ol>
            </li>
          </ol>
          <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#e9f2fb', borderRadius: '8px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Illustration</h4>
            <p style={{ marginBottom: '8px' }}>C is a child, P is a parent, and DF is a Data Fiduciary. A user account of C is sought to be created on the online platform of DF, by processing the personal data of C.</p>
            <p style={{ marginBottom: '8px' }}><strong>Case 1:</strong> C informs DF that she is a child and declares P as her parent. DF shall enable P to identify herself through its website, app or other appropriate means. P identifies herself as the parent and informs DF that she is a registered user on DF’s platform and has previously made available her identity and age details to DF. Before processing C’s personal data for the creation of her user account, DF shall check to confirm that it holds reliable identity and age details of P and that P is an identifiable adult.</p>
            <p style={{ marginBottom: '8px' }}><strong>Case 2:</strong> C informs DF that she is a child and declares P as her parent. DF shall enable P to identify herself through its website, app or other appropriate means. P identifies herself as the parent and informs DF that she herself is not a registered user on DF’s platform. Before processing C’s personal data for the creation of her user account, DF shall, by reference to identity and age details issued by an entity entrusted by law or the Government with maintenance of the said details or to a virtual token mapped to the identity and age, check that P is an identifiable adult. P may voluntarily make such details available using the services of a Digital Locker service provider</p>
            <p style={{ marginBottom: '8px' }}><strong>Case 3:</strong> P is opening an account for C and identifies herself as C’s parent and informs DF that she is a registered user on DF’s platform and has previously made available her identity and age details to DF. Before processing C’s personal data for the creation of her user account, DF shall check to confirm that it holds reliable identity and age details of P and that P is an identifiable adult.</p>
            <p style={{ marginBottom: '0' }}><strong>Case 4:</strong> P is opening an account for C and identifies herself as C’s parent and informs DF that she herself is not a registered user on DF’s platform. Before processing C’s personal data for the creation of her user account, DF shall, by reference to identity and age details issued by an entity entrusted by law or the Government with maintenance of the said details or to a virtual token mapped to the identity and age, check that P is an identifiable adult. P may voluntarily make such details available using the services of a Digital Locker service provider.</p>
          </div>
        </div>

        {/* Rule 11 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 11: Verifiable consent for processing of personal data of person with disability who has lawful guardian</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>A Data Fiduciary, while obtaining verifiable consent from an individual identifying herself as the lawful guardian of a person with disability, shall observe due diligence to verify that such guardian is appointed by a court of law, or by a designated authority or by a local level committee, under the law applicable to guardianship.</li>
            <li>In this rule, the expression—
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>“designated authority” shall mean an authority designated under section 15 of the Rights of Persons with Disabilities Act, 2016 (49 of 2016) to support persons with disabilities in exercise of their legal capacity;</li>
                <li>“law applicable to guardianship” shall mean, —
                  <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                    <li>in relation to an individual who has long term physical, mental, intellectual or sensory impairment which, in interaction with barriers, hinders her full and effective participation in society equally with others and who despite being provided adequate and appropriate support is unable to take legally binding decisions, the provisions of law contained in Rights of Persons with Disabilities Act, 2016 (49 of 2016) and the rules made thereunder; and</li>
                    <li>in relation to a person who is suffering from any of the conditions relating to autism, cerebral palsy, mental retardation or a combination of such conditions and includes a person suffering from severe multiple disability, the provisions of law of the National Trust for the Welfare of Persons with Autism, Cerebral Palsy, Mental Retardation and Multiple Disabilities Act, 1999 (44 of 1999) and the rules made thereunder;</li>
                  </ol>
                </li>
                <li>“local level committee” shall mean a local level committee constituted under section 13 of the National Trust for the Welfare of Persons with Autism, Cerebral Palsy, Mental Retardation and Multiple Disabilities Act, 1999 (44 of 1999);</li>
                <li>“person with disability” shall mean and include—
                  <ol style={{ listStyleType: 'lower-roman', paddingLeft: '20px', marginTop: '4px' }}>
                    <li>an individual who has long term physical, mental, intellectual or sensory impairment which, in interaction with barriers, hinders her full and effective participation in society equally with others and who, despite being provided adequate and appropriate support, is unable to take legally binding decisions; and</li>
                    <li>an individual who is suffering from any of the conditions relating to autism, cerebral palsy, mental retardation or a combination of any two or more of such conditions and includes an individual suffering from severe multiple disability and who, despite being provided adequate and appropriate support, is unable to take legally binding decisions.</li>
                  </ol>
                </li>
              </ol>
            </li>
          </ol>
        </div>

        {/* Rule 12 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 12: Exemptions from certain obligations applicable to processing of personal data of child</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>The provisions of sub-sections (1) and (3) of section 9 of the Act shall not be applicable to processing of personal data of a child by such class of Data Fiduciaries as are specified in Part A of Fourth Schedule, subject to such conditions as are specified in the said Part.</li>
            <li>The provisions of sub-sections (1) and (3) of section 9 of the Act shall not be applicable to processing of personal data of a child for such purposes as are specified in Part B of Fourth Schedule, subject to such conditions as are specified in the said Part.</li>
          </ol>
        </div>

        {/* Rule 13 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 13: Additional obligations of Significant Data Fiduciary</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>A Significant Data Fiduciary shall, once in every period of twelve months from the date on which it is notified as such or is included in the class of Data Fiduciaries notified as such, undertake a Data Protection Impact Assessment and an audit to ensure effective observance of the provisions of this Act and the rules made thereunder.</li>
            <li>A Significant Data Fiduciary shall cause the person carrying out the Data Protection Impact Assessment and audit to furnish to the Board a report containing significant observations in the Data Protection Impact Assessment and audit.</li>
            <li>A Significant Data Fiduciary shall observe due diligence to verify that technical measures including algorithmic software adopted by it for hosting, display, uploading, modification, publishing, transmission, storage, updating or sharing of personal data processed by it are not likely to pose a risk to the rights of Data Principals.</li>
            <li>A Significant Data Fiduciary shall undertake measures to ensure that personal data specified by the Central Government, on the basis of the recommendations of a committee constituted by it, is processed subject to the restriction that the personal data and the traffic data pertaining to its flow is not transferred outside the territory of India.</li>
            <li>In this rule, “committee” means a committee constituted by the Central Government for the purpose of this rule, which shall include officials from the Ministry of Electronics and Technology and may include officials from other Ministries or Department of the Central Government.</li>
          </ol>
        </div>

        {/* Rule 14 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 14: Rights of Data Principals</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>For enabling Data Principals to exercise their rights under the Act, the Data Fiduciary and, where applicable, the Consent Manager, shall prominently publish on its website or app, or both, as the case may be, —
              <ol style={{ listStyleType: 'lower-alpha', paddingLeft: '20px', marginTop: '4px' }}>
                <li>the details of the means using which a Data Principal may make a request for the exercise of such rights; and</li>
                <li>the particulars, if any, such as the username or other identifier of such a Data Principal, which may be required to identify her under its terms of service.</li>
              </ol>
            </li>
            <li>To exercise the rights of the Data Principal under the Act, she may make a request to the Data Fiduciary to whom she has previously given consent for processing of her personal data, using the means and furnishing the particulars required by such Data Fiduciary for the exercise of such rights.</li>
            <li>Every Data Fiduciary and Consent Manager shall prominently publish on its website or app, or both, as the case may be, within a reasonable period not exceeding ninety days under its grievance redressal system for responding to the grievances of Data Principals and shall, for ensuring the effectiveness of the system in responding within such period, implement appropriate technical and organisational measures.</li>
            <li>To exercise the rights of the Data Principal under the Act, she may, in accordance with the terms of service of the Data Fiduciary and such law as may be applicable, nominate one or more individuals, using the means and furnishing the particulars required by such Data Fiduciary for the exercise of such right.</li>
            <li>In this rule, the expression “identifier” shall mean any sequence of characters issued by the Data Fiduciary to identify the Data Principal and includes a customer identification file number, customer acquisition form number, application reference number, enrolment ID, email address, mobile number or licence number that enables such identification.</li>
          </ol>
        </div>

        {/* Rule 15 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 15: Transfer of personal data outside the territory of India</h2>
          <p>Any personal data processed by a Data Fiduciary under the Act may be transferred outside the territory of India subject to the restriction that the Data Fiduciary shall meet such requirements as the Central Government may, by general or special order, specify in respect of making such personal data available to any foreign State, or to any person or entity under the control of or any agency of such a State.</p>
        </div>

        {/* Rule 16 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 16: Exemption from Act for research, archiving or statistical purposes</h2>
          <p>The provisions of the Act shall not apply to the processing of personal data necessary for research, archiving or statistical purposes if it is carried on in accordance with the standards specified in Second Schedule.</p>
        </div>

        {/* Rule 17 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 17: Appointment of Chairperson and other Members</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>The Central Government shall constitute a Search-cum-Selection Committee, with the Cabinet Secretary as the chairperson and the Secretaries to the Government of India in charge of the Department of Legal Affairs and the Ministry of Electronics and Information Technology and two experts of repute having special knowledge or practical experience in a field which in the opinion of the Central Government may be useful to the Board as members, to recommend individuals for appointment as Chairperson.</li>
            <li>The Central Government shall constitute a Search-cum-Selection Committee, with the Secretary to the Government of India in the Ministry of Electronics and Information Technology as the chairperson and the Secretary to the Government of India in charge of the Department of Legal Affairs, and two experts of repute having special knowledge or practical experience in a field which in the opinion of the Central Government may be useful to the Board as members, to recommend individuals for appointment as a Member other than the Chairperson.</li>
            <li>The Central Government shall, after considering the suitability of individuals recommended by the Search-cum-Selection Committee, appoint the Chairperson or other Member, as the case may be.</li>
            <li>No act or proceeding of the Search-cum-Selection Committee specified in sub-rules (1) and (2) of this rule shall be called in question on the ground merely of the existence of any vacancy or absences in such committee or defect in its constitution.</li>
          </ol>
        </div>

        {/* Rule 18 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 18: Salary, allowances and other terms and conditions of service of Chairperson and other Members</h2>
          <p>The Chairperson and every other Member shall receive such salary and allowances and shall have such other terms and conditions of service as are specified in Fifth Schedule.</p>
        </div>

        {/* Rule 19 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 19: Procedure for meetings of Board and authentication of its orders, directions and instruments</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>The Chairperson shall fix the date, time and place of meetings of the Board, approve the items of agenda therefor, and cause notice specifying the same to be issued under her signature or that of such other individual as the Chairperson may authorise by general or special order in writing.</li>
            <li>Meetings of the Board shall be chaired by the Chairperson and, in her absence, by such other Member as the Members present at the meeting may choose from amongst themselves.</li>
            <li>One-third of the membership of the Board shall be the quorum for its meetings.</li>
            <li>All questions which come up before any meeting of the Board shall be decided by a majority of the votes of Members present and voting, and, in the event of an equality of votes, the Chairperson, or in her absence, the person chairing, shall have a second or casting vote.</li>
            <li>If a Member has an interest in any item of business to be transacted at a meeting of the Board, she shall not participate in or vote on the same and, in such a case, the decision on such item shall be taken by a majority of the votes of other Members present and voting.</li>
            <li>In case an emergent situation warrants immediate action by the Board and it is not feasible to call a meeting of the Board, the Chairperson may, while recording the reasons in writing, take such action as may be necessary, which shall be communicated within seven days to all Members and laid before the Board for ratification at its next meeting.</li>
            <li>If the Chairperson so directs, an item of business or issue which requires decision of the Board may be referred to Members by circulation and such item may be decided with the approval of majority of the Members.</li>
            <li>The Chairperson or any Member of the Board, or any individual authorised by it,by a general or special order in writing, may, under her signature, authenticate its order, direction or instrument.</li>
            <li>The inquiry by the Board shall be completed within a period of six months from the date of receipt of the intimation, complaint, reference or direction under section 27 of the Act, unless such period is extended by it, for reasons to be recorded in writing, for a further period not exceeding three months at a time.</li>
          </ol>
        </div>

        {/* Rule 20 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 20: Functioning of Board as digital office</h2>
          <p>The Board shall function as a digital office, without prejudice to its power to summon and enforce the attendance of any person and examine her on oath, may adopt techno-legal measures to conduct proceedings in a manner that does not require physical presence of any individual.</p>
        </div>

        {/* Rule 21 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0B2D5E' }}>Rule - 21: Terms and conditions of appointment and service of officers and employees of Board</h2>
          <ol style={{ paddingLeft: '24px', marginBottom: '0' }}>
            <li>Board may, with previous approval of the Central Government, appoint such officers and employees as it may deem necessary for the efficient discharge of its functions under the provisions of the Act.</li>
            <li>The terms and conditions of service of officers and employees of the Board shall be such as are specified in Sixth Schedule.</li>
          </ol>
        </div>

      </div>
    </div>
  );
};

export default DPDPACompliance;
