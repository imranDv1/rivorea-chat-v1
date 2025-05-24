"use client"
import { FC } from 'react'
import Button from '@/components/ui/Button'
import { addFriendValidator } from './validations/add-friend'
import axios, { AxiosError } from 'axios'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'



type FormData = z.infer<typeof addFriendValidator>

const AddFreindButton: FC = ({}) => {

    const [showSuccessState, setshowSuccessState] = useState<boolean>(false)

    const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(addFriendValidator),

    })


    const addFriend = async (email: string) => {

        try {
             const validEmail =  addFriendValidator.parse({ email })
             await axios.post("/api/friends/add", {
                email: validEmail
             })
             setshowSuccessState(true)

        } catch (error) {
           if(error instanceof z.ZodError) {
            setError("email", { message: error.message})
            return
            }

            if(error instanceof AxiosError){
                setError("email", { message: error.response?.data})
            return
            }

            setError("email", { message: "Something went wrong, please try again later." })
            

        }

    }

    const onSubmit = (data: FormData) => {
        addFriend(data.email)
    }

    return (
        <form className="max-w-sm w-full" onSubmit={handleSubmit(onSubmit)}>
            <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
            >
                Add friend by Email
            </label>
            <div className="mt-2 flex gap-4">
                <input
                {...register("email")}
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 focus:outline-none pl-3"
                    placeholder="you@example.com"
                />
                <Button className="h-10 px-4">Add</Button>
            </div>
            <p className='mt-1 text-sm text-red-600'>{errors.email?.message}</p>
            {showSuccessState ?(
                <p className='mt-1 text-sm text-green-600'>Friend request sent successfully!</p>
            ):null }
        </form>
    )
}

export default AddFreindButton