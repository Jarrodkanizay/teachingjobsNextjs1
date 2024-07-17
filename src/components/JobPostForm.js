'use client';
import React, { useState, useEffect } from 'react';
import InputBlock from '@/components/forms/InputBlock';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { BaseApi } from '@/lib/store/Base';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jobElephantContacts } from '@/data/jobElephantContacts';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Speedo from '@/components/icons/Speedo';
import { useParams } from 'next/navigation'
import Tiptap from './Tiptap';
const stripeLink = ['https://buy.stripe.com/4gw6q47Ty5Uk7VC4gw', 'https://buy.stripe.com/bIY15K0r60A0b7OaEX', 'https://buy.stripe.com/7sI8ycgq482s3Fm14o']
const JobPostForm = ({ partner, region = 'Australia' }) => {
  const [regionSelected, setRegion] = useState(region);
  const [standardMode, setStandardMode] = useState(true);
  const [newContact, setNewContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ regionSelected });
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [paymentMessage, setPaymentMessage] = useState('Credit Card');
  useEffect(() => {
    console.log('Region', regionSelected);
  }, [regionSelected]); // This effect runs whenever `regionSelected` changes
  const handleChange = (event) => {
    setSelectedCurrency(event.target.value);
    // Get the selected option element
    const selectedOption = event.target.options[event.target.selectedIndex];
    // Get the text of the selected option
    const selectedRegion = selectedOption.text;
    setRegion(selectedRegion);
  };
  let avatarPath = '';
  let textColor = 'text-aj';
  let partnerName = 'TeachingJobs';
  let partnerLogo = '';
  let partnerImage = '/partners/post-a-job.jpg';
  let partnerPullDown = false;
  let institutionName = `School Name (ie: James Ruse Agricultural High School)`;
  let urlExample = `school-name.edu.au/job-posting-url`;
  if (partner === 'JobElephant') {
    partnerPullDown = true;
    partnerName = partner;
    institutionName = `${partnerName} (ie: Utah University)`;
    textColor = 'text-emerald-600';
    partnerLogo =
      'https://academicjobs.s3.amazonaws.com/img/_misc/proudly-working-with.png';
    partnerImage =
      'https://academicjobs.s3.amazonaws.com/img/_misc/jobelephant-puzzle.png';
    avatarPath = '/partners/jobelephant/avatars/';
    urlExample = `apptrkr.com/...`;
  }
  useEffect(() => {
    //alert(partnerName)
    if (partnerName === '' || partnerName === 'TeachingJobs') {
      setStandardMode(true);
    } else {
      setStandardMode(false);
    }
  }, [partnerName]);
  let content;
  const router = useRouter();
  //const { id } = router.query;
  const { id = '1' } = useParams()
  // const [title, setTitle] = useState("")

  let title = ""
  let xeroId;
  let description;
  let price;
  switch (id) {
    case "1":
      title = "(Single Job)"
      description = "Single Job Posting on TeachingJobs.com.au"
      xeroId = "TESTxeroAPI"
      price = 188
      break
    case "2":
      title = "(5 Job Pack)"
      description = "5 Job Pack on TeachingJobs.com.au"
      xeroId = "TJ-5"
      price = 752
      break
    case "3":
      title = "(10 Job Pack)"
      description = "10 Job Pack on TeachingJobs.com.au"
      price = 1316
      xeroId = "TJ-10"
      break
  }
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      paymentMethod: 'creditCard',
    },
  });
  const onSubmit = async (data) => {
    let emailData = {
      ...data,
      '00_formSource': `WOO HOO, ring the bell, WE JUST GOT ANOTHER JOB LISTING from the ${partnerName} Post a Job Page`,
    };

    if (data.paymentMethod === 'invoice') {
      try {
        const response = await BaseApi.post('/invoices/create', {
          product: { id: xeroId, description: `${description}`, price: price },
          customerDetails: {
            name: data['01_First_Name'] + ' ' + data['01_Last_Name'],
            email: data['02_Email'],
            address: data['01_Organisation_Name'],
          },
          invoiceDetails: {
            address: {
              line1: data['address_line1'],
              line2: data['address_line2'],
              city: data['city'],
              region: data['region'],
              postalCode: data['postalCode'],
              country: data['country'],
            },
            reference: data['08_Invoice_Reference'],
          },
        });

        if (response.status === 200) {
          emailData['Invoice sent'] = 'True';
          emailData['00_formSource'] += ' (Invoice Sent)';
        } else {
          throw new Error('Failed to create invoice');
        }
      } catch (error) {
        console.error('Error during invoice creation:', error);

        let errorMessage = 'Unknown error occurred during invoice creation';
        let errorDetails = error.message;

        if (error.response && error.response.data) {
          errorMessage = error.response.data.error || errorMessage;
          errorDetails = error.response.data.details || errorDetails;
        }

        emailData['Invoice sent'] = 'False';
        emailData['Invoice error'] = errorDetails;
        emailData['00_formSource'] += ' (Invoice Error)';
        setError('server', {
          type: 'manual',
          message: errorMessage,
        });
      }
    }

    try {
      await mutation.mutateAsync(emailData);
    } catch (error) {
      console.error('Error during email sending:', error);
    }
  };
  const mutation = useMutation({
    mutationFn: async (data) => {
      return await BaseApi.post('/sendemail', data);
    },
  });
  if (mutation.isLoading) {
    return (
      <div className="bg-white relative max-w-screen-lg mx-auto pl-2">
        <div className="p-4 animate-pulse">
          <div className="w-1/4 pr-4">
            <div className="rounded-xl bg-gray-300 h-16 w-full">
              'Sending Jobs ...'
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (mutation.isError) {
    return <div>An error occurred: {mutation.error.message}</div>;
  }
  if (mutation.isSuccess) {
    if (paymentMessage === 'invoice') {
      router.push('/thank-you');
    }
    if (paymentMessage === 'Credit Card') {
      console.log("id", id);
      router.push(stripeLink[id - 1]);
    }
  } else {
    content = (
      <main className=" content-grid">
        <div className="w-full grid grid-cols-1 md:grid-cols-1 gap-16">
          <div>
            <h1
              className={`text-4xl font-bold my-0 underline-full text-[#3b5683]`}
            >
              {partnerName} Quick Post <span className="text-2xl">{title} </span>
            </h1>
            <form className="" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 justify-start">
                {standardMode ? null : (
                  <div className="w-full  flex  ">
                    <label className="label-text text-xs mb-1">
                      Name (JobElephant person posting the job)
                    </label>
                    <select
                      className="select select-bordered w-full bg-white focus:outline-none focus:border-orange-500"
                      {...register('01_Name_Job_Elephant')}
                      onChange={(e) => {
                        if (partnerName === 'JobElephant') {
                          setValue('01_Organisation_Name', 'JobElephant');
                        }
                        if (e.target.value === 'Add Contact') {
                          setNewContact(true);
                          setSelectedContact(null);
                          setValue('00_First_Name', '');
                          setValue('00_Last_Name', '');
                          setValue('02_Email', '');
                        } else {
                          setNewContact(false);
                          const selectedContact = jobElephantContacts.find(
                            (contact) =>
                              `${contact.firstName} ${contact.lastName} - ${contact.email}` ===
                              e.target.value
                          );
                          setSelectedContact(selectedContact);
                          if (selectedContact) {
                            setValue(
                              '00_First_Name',
                              selectedContact.firstName
                            );
                            setValue('00_Last_Name', selectedContact.lastName);
                            setValue('02_Email', selectedContact.email);
                          }
                        }
                      }}
                    >
                      <option value="SelectContact" disabled selected>
                        Select Contact
                      </option>
                      {jobElephantContacts.map((el, index) => (
                        <>
                          <option
                            key={index}
                            value={`${el.firstName} ${el.lastName} - ${el.email}`}
                          >
                            {`${el.firstName} ${el.lastName} - ${el.email}`}
                          </option>
                        </>
                      ))}
                      <option value="Add Contact">Add Contact</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {selectedContact && selectedContact.avatar && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image
                        src={`${avatarPath}${selectedContact.avatar}`}
                        alt="Avatar"
                        width={100} // replace with your desired width
                        height={100} // replace with your desired height
                      />
                      <p className="mt-3">
                        Hi <b>{selectedContact.firstName}</b>, welcome to your
                        quick post form.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="lg:flex full-width items-center gap-6 mt-8 ">
                <div
                  className={`bg-slate-200 full-width p-4 rounded-3xl md:w-1/3 md:mb-0 mb-2 min-h-[550px] ${newContact || standardMode ? 'show-form' : 'hide-form'
                    }`}
                >
                  <div className="grid w-full items-center gap-1.5">
                    {partnerName === 'JobElephant' ? null : (
                      <>
                        <label
                          htmlFor="currency"
                          className="label-text text-xs hidden"
                        >
                          Region
                        </label>
                        <select
                          id="currency"
                          value={selectedCurrency}
                          onChange={handleChange}
                          name="currency"
                          className="select select-bordered w-full bg-white focus:outline-none focus:border-orange-500"
                          required
                          hidden
                        >
                          {/* <option value={regionSelected} selected>
                            {regionSelected}
                          </option> */}
                          {Object.keys(stripeLink)
                            .filter((key) => key !== 'JobElephant')
                            .map((key) => (
                              <option key={key} value={stripeLink[key]}>
                                {key}
                              </option>
                            ))}
                        </select>
                      </>
                    )}

                  </div>
                  <InputBlock
                    register={register}
                    errors={errors}
                    label="Organization Name (i.e. Agency/ School name)"
                    type="text"
                    field="01_Organisation_Name"
                    forceClass=" py-3 text-black"
                    placeholder="Organization Name"
                    autoComplete="organization"
                    hidden={newContact || standardMode ? false : true}
                    required={true}
                  />

                  <InputBlock
                    register={register}
                    errors={errors}
                    label={institutionName}
                    type="text"
                    field="03_Institution_Name"
                    forceClass="py-3 text-black"
                    placeholder="School Name"
                    required={true}
                  />

                  <InputBlock
                    register={register}
                    errors={errors}
                    label="First Name"
                    type="text"
                    field="01_First_Name"
                    forceClass=" py-3 text-black"
                    placeholder="First Name"
                    autoComplete="given-name"
                    hidden={newContact || standardMode ? false : true}
                    required={newContact || standardMode ? true : false}
                  />

                  <InputBlock
                    register={register}
                    errors={errors}
                    label="Last Name"
                    type="text"
                    field="01_Last_Name"
                    forceClass=" py-3 text-black"
                    placeholder="Last Name"
                    autoComplete="family-name"
                    hidden={newContact || standardMode ? false : true}
                    required={newContact || standardMode ? true : false}
                  />
                  <InputBlock
                    register={register}
                    errors={errors}
                    label="Email"
                    type="email"
                    field="02_Email"
                    forceClass=" py-3 text-black"
                    placeholder="mail"
                    autoComplete="email"
                    hidden={newContact || standardMode ? false : true}
                    required={true}
                  />
                  <InputBlock
                    register={register}
                    errors={errors}
                    label={`Job Link URL (ie: ${urlExample})`}
                    type="text"
                    field="04_Job_Link_URL"
                    forceClass=" py-3 text-black"
                    placeholder="Job Link"
                    required={true}
                  />
                </div>

                <div
                  className={`bg-slate-200 full-width p-4 rounded-3xl md:w-1/3 md:mb-0 mb-2  ${newContact || standardMode ? 'show-form' : 'hide-form'
                    }`}
                >
                  <div className="grid w-full items-center gap-1.5 min-h-[550px]">

                    <label className="form-control">
                      <span className="label-text text-xs py-2">
                        Notes or Special Instructions
                      </span>
                      <textarea
                        className="textarea textarea-bordered h-32 focus:outline-none focus:border-orange-500"
                        id="notes"
                        placeholder="Type your message here."
                        {...register('05_Notes')}
                      ></textarea>
                    </label>

                    <label className="form-control py-2">
                      <span className="label-text text-xs py-1 mt-4">
                        Copy/paste your Job Post here
                      </span>
                      <Tiptap
                        content={content}
                        onChange={(newContent) => handleContentChange(newContent)}
                      />
                    </label>

                    <div className="flex gap-4 py-2">
                      <label htmlFor="creditCard" className="label cursor-pointer text-xs">
                        <strong className="mr-2">Payment method:</strong>Credit Card
                        (Pay Now)
                        <input
                          type="radio"
                          id="creditCard"
                          name="paymentMethod"
                          value="creditCard"
                          {...register('paymentMethod')}
                          onClick={() => { setPaymentMessage('Credit Card'); setPaymentMethod('creditCard') }}
                          className="radio radio-aj ml-2"
                        />
                      </label>

                      <label htmlFor="invoice" className="label cursor-pointer text-xs">
                        Invoice (Pay Later)
                        <input
                          type="radio"
                          id="invoice"
                          name="paymentMethod"
                          value="invoice"
                          {...register('paymentMethod')}
                          onClick={() => { setPaymentMessage('invoice'); setPaymentMethod('invoice') }}
                          className="radio radio-aj ml-2"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button className={`${paymentMethod === 'invoice' ? 'hidden' : ''} btn btn-accent mt-4`}>
                        Post & Pay via {paymentMessage}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-200 full-width p-4 rounded-3xl min-h-[550px] md:w-1/3" >

                  {paymentMethod === 'invoice' ? (
                    <>
                      <label className="form-control">
                        <span className="label-text text-lg pb-1">
                          Invoice Details
                        </span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputBlock
                          register={register}
                          errors={errors}
                          label="Address Line 1"
                          type="text"
                          field="address_line1"
                          forceClass=" text-black"
                          placeholder="Address Line 1"
                          required={true} />
                        <InputBlock
                          register={register}
                          errors={errors}
                          label="Address Line 2"
                          type="text"
                          field="address_line2"
                          forceClass=" text-black"
                          placeholder="Address Line 2"
                          required={false} />

                        <InputBlock
                          register={register}
                          errors={errors}
                          label="City"
                          type="text"
                          field="city"
                          forceClass=" text-black"
                          placeholder="City"
                          required={true} />


                        <InputBlock
                          register={register}
                          errors={errors}
                          label="Region"
                          type="text"
                          field="region"
                          forceClass=" text-black"
                          placeholder="Region"
                          required={true} />

                        <InputBlock
                          register={register}
                          errors={errors}
                          label="Postal Code"
                          type="text"
                          field="postalCode"
                          forceClass=" text-black"
                          placeholder="Postal Code"
                          required={true} />

                        <InputBlock
                          register={register}
                          errors={errors}
                          label="Country"
                          type="text"
                          field="country"
                          forceClass=" text-black"
                          placeholder="Country"
                          required={true} />
                      </div><InputBlock
                        register={register}
                        errors={errors}
                        label="Invoice Reference (for your records)"
                        type="text"
                        field="08_Invoice_Reference"
                        forceClass=" text-black mt-4"
                        placeholder="Invoice Reference"
                        required={true} />
                      <div className="flex justify-end">
                        <button className="btn btn-accent mt-4">
                          Post & Pay via {paymentMessage}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Speedo size={60} />

                      <h3 className={`${textColor} my-0 py-9`}>
                        Post a job in 32 seconds saving you 8 minutes each time!{' '}
                      </h3>

                      <div className="prose">
                        <p className="mt-4">
                          The average time to Post a Job and fill out a form on the major
                          Job Seeking platforms is 9 min or more. With TeachingJobs we
                          make your life easier and save you time by…
                        </p>
                        <ul>
                          <li>
                            Reducing Job Posting times to seconds rather than minutes
                          </li>
                          <li>
                            We do the heavy lifting for you (just provide a link to the
                            post)
                          </li>
                          <li className="font-bold">
                            Choose Invoice if you have already purchased a job pack
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </form>
            {partnerLogo !== '' ? (
              <picture className="min-w-full max-w-2xl mx-auto mt-16">
                <Image
                  width={800}
                  height={380}
                  src={partnerLogo ? partnerLogo : ''}
                  alt={`${partnerName ? partnerLogo : ''} logo`}
                  className="mx-auto bg-gray-200"
                />
              </picture>
            ) : null}
          </div>
          {/* Right panel */}

        </div>
      </main>
    );
  }
  return <>{content}</>;
};
export default JobPostForm;
